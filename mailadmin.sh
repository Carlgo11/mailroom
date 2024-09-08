#!/usr/bin/env bash

# Base URL of your Controller API
BASE_URL="http://localhost:6804"

# Print usage information
function usage() {
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  create-user <email> <password>   Create a new email user"
    echo "  delete-user <email>              Delete an existing email user"
    echo "  list-users                       List all email users"
    echo "  get-user <email>                 Get details of a specific user"
    echo "  generate-cert <email>            Generate a client certificate for the user"
    echo
}

# Send request to create a user
function create_user() {
    if [ -z "$2" ]; then
        echo "Error: Email and password required."
        usage
        exit 1
    fi
    email="$1"
    password="$2"


    echo "Creating user: $email"
    curl -X POST "${BASE_URL}/users/register" \
         -H "Content-Type: application/json" \
         -d "{\"username\": \"$email\"; \"password\": \"$password\"}"
}

# Send request to delete a user
function delete_user() {
    if [ -z "$1" ]; then
        echo "Error: Email address required."
        usage
        exit 1
    fi
    email="$1"

    echo "Deleting user: $email"
    curl -X DELETE "${BASE_URL}/users/${email}"
}

# List all users
function list_users() {
    echo "Existing users:"
    curl -s -X GET "${BASE_URL}/users" -H "Content-Type: application/json" | jq -r '.[]' | nl -w 2 -s '. '
}

# Get user details
function get_user() {
    if [ -z "$1" ]; then
        echo "Error: Email address required."
        usage
        exit 1
    fi
    email="$1"
    echo "${email} details:"
    curl -s -X GET "${BASE_URL}/users/${email}" -H "Content-Type: application/json" | jq -r 'to_entries[] | "  \(.key): \(.value)"'
}

# Generate certificate for user
function generate_cert() {
    if [ -z "$1" ]; then
        echo "Error: Email address required."
        usage
        exit 1
    fi
    email="$1"

    echo "Generating certificate for user: $email"
    curl -X POST "${BASE_URL}/users/${email}/generate-cert"
}

# Parse command-line arguments
if [ "$#" -lt 1 ]; then
    usage
    exit 1
fi

command="$1"
shift

case "$command" in
    create-user)
        create_user "$@"
        ;;
    delete-user)
        delete_user "$@"
        ;;
    list-users)
        list_users
        ;;
    get-user)
        get_user "$@"
        ;;
    generate-cert)
        generate_cert "$@"
        ;;
    *)
        echo "Error: Unknown command: $command"
        usage
        exit 1
        ;;
esac
