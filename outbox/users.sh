#!/bin/sh

COMMAND=$1
USERNAME=$2
CA_DIR="$(dirname "${OUTBOX_TLS_CA_PATH}")"
OPENSSL_CONF="${CA_DIR}/ca.cnf"

generate_user() {
    if [ -z "$USERNAME" ]; then
        echo "Username is required for generating a user."
        exit 1
    fi

    # Generate private key
    openssl genpkey -algorithm RSA -out "${CA_DIR}/${USERNAME}-key.pem" -aes256 -pkeyopt rsa_keygen_bits:4096

    # Create a CSR using the username as the CN
    openssl req -new -key "${CA_DIR}/${USERNAME}-key.pem" -out "${CA_DIR}/${USERNAME}-csr.pem" -subj "/CN=$USERNAME" -config "${OPENSSL_CONF}"

    # Sign the CSR with the CA
    openssl ca -config "${OPENSSL_CONF}" -extensions req_ext -days 3650 -notext -md sha512 -in "${CA_DIR}/${USERNAME}-csr.pem" -out "${CLIENT_CERT_PATH}/${USERNAME}.pem"

    # Create PKCS12 file
    openssl pkcs12 -export -out "${CA_DIR}/${USERNAME}.p12" -inkey "${CA_DIR}/${USERNAME}-key.pem" -in "${CLIENT_CERT_PATH}/${USERNAME}.pem" -certfile "${CA_DIR}/ca.pem" -name "${USERNAME} certificate" -passout pass:

    # Clean up CSR
    rm "${CA_DIR}/${USERNAME}-csr.pem"

    echo "User $USERNAME created with certificate."
}

revoke_user() {
    if [ -z "$USERNAME" ]; then
        echo "Username is required for revoking a user."
        exit 1
    fi

    # Revoke the user's certificate
    openssl ca -config "${OPENSSL_CONF}" -revoke "${CA_DIR}/${USERNAME}-cert.pem"

    # Update the CRL
    openssl ca -config "${OPENSSL_CONF}" -gencrl -out "${CA_DIR}/crl.pem"

    echo "User $USERNAME's certificate has been revoked."
}

case $COMMAND in
    add)
        generate_user
        ;;
    revoke)
        revoke_user
        ;;
    *)
        echo "Usage: $0 {add|revoke} username"
        ;;
esac
