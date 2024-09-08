#!/bin/sh
set -e

# Define directories and files based on environment variables
CA_DIR="$(dirname "${OUTBOX_TLS_CA_PATH}")"
CA_CERT="${OUTBOX_TLS_CA_PATH}"
CA_KEY="${CA_DIR}/ca-key.pem"
CA_FULL="${CA_DIR}/ca-full.pem"
CRL_FILE="${CA_DIR}/crl.pem"
INDEX_FILE="${CA_DIR}/index.txt"
SERIAL_FILE="${CA_DIR}/ca-cert.srl"
CRLNUMBER_FILE="${CA_DIR}/crlnumber"
OPENSSL_CONF="${CA_DIR}/ca.cnf"  # Path to the dynamically generated openssl.cnf

# Ensure CA directory exists
mkdir -p "${CA_DIR}"

# Generate the openssl.cnf file if it doesn't exist
if [ ! -f "${OPENSSL_CONF}" ]; then
    echo "Generating ca.cnf..."
    cat > "${OPENSSL_CONF}" <<EOL
[ ca ]
default_ca = CLIENT_CA

[ CLIENT_CA ]
dir               = ${CA_DIR}
certificate       = \$dir/ca-cert.pem
private_key       = \$dir/ca-key.pem
database          = \$dir/index.txt
serial            = \$dir/ca-cert.srl
new_certs_dir     = \$dir/certs
crlnumber         = \$dir/crlnumber
crl               = \$dir/crl.pem
default_crl_days  = 30
default_md        = sha512

policy            = policy_anything

[ policy_anything ]
countryName            = optional
stateOrProvinceName    = optional
localityName           = optional
organizationName       = optional
organizationalUnitName = optional
commonName             = supplied
emailAddress           = optional

[ req ]
default_bits       = 4096
prompt             = no
default_md         = sha512
distinguished_name = dn
req_extensions     = req_ext

[ dn ]
CN = ${USERNAME}

[ req_ext ]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, emailProtection

[ crl_ext ]
authorityKeyIdentifier = keyid:always,issuer:always
EOL
else
    echo "Existing ca.cnf found. Skipping generation."
fi

# Check if CA certificate and key exist, if not, generate them
if [ ! -f "${CA_CERT}" ] || [ ! -f "${CA_KEY}" ]; then
    echo "CA certificate or key not found. Generating new CA certificate and key..."

    # Generate the private key
    openssl ecparam -genkey -name secp521r1 -out "${CA_KEY}"

    # Generate the CA certificate
    openssl req -new -x509 -days 3650 -key "${CA_KEY}" -out "${CA_CERT}" -subj "/CN=Outbox CA" -sha512

    # Initialize serial and index files if they do not exist
    echo "00" > "${SERIAL_FILE}"
    touch "${INDEX_FILE}"
    echo "1000" > "${CRLNUMBER_FILE}"
else
    echo "CA certificate and key found. Skipping generation."
fi

# Generate CRL if it doesn't exist or renew it if it's older than 30 days
if [ ! -f "${CRL_FILE}" ] || [ "$(find "${CRL_FILE}" -mtime +30)" ]; then
    echo "Generating new CRL..."
    openssl ca -config "${OPENSSL_CONF}" -gencrl -out "${CRL_FILE}"
else
    echo "Existing CRL found and is up to date. Skipping CRL generation."
fi

# Combine CA certificate and CRL into a single file
echo "Combining CA certificate and CRL into ca-full.pem..."
cat "${CA_CERT}" "${CRL_FILE}" > "${CA_FULL}"

# Ensure correct permissions (optional, depending on your security needs)
chmod 600 "${CA_KEY}" "${CA_FULL}"
