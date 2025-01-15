#!/usr/bin/env bash
set -e

# Define repository URL for installation files
REPO="https://raw.githubusercontent.com/Carlgo11/mailroom/master/installation"

# Function to check for required commands
check_dependency() {
  if [ ! "$(which "$1")" ]; then
    echo "Installation requires $1"
    exit 1
  fi
}

# Define function to execute additional scripts
run_additional_task() {
  local script_name=$1
  echo "Downloading and executing $script_name..."
  curl -sSL "$REPO/$script_name" -o "$script_name"
  chmod +x "$script_name"
  ./"$script_name"
  rm -f "$script_name" # Clean up after execution
}

# Check dependencies
check_dependency curl
check_dependency bash
check_dependency docker
check_dependency node
check_dependency npm

# Welcome message
echo "Welcome to the Mail Room installer!"

# Create root directory
echo "Creating Mail Room directory..."
mkdir -p mailroom
cd mailroom
curl -sSL "https://raw.githubusercontent.com/Carlgo11/mailroom/master/mailroom.env" -o mailroom.env
ln -s mailroom.env .env

run_additional_task "setup-compose.sh"

# Create certificates directory
echo "Setting up certificates directories..."
mkdir -p certs/{clients,dkim,dovecot,inbox,outbox}

# Option to install CLI tool
read -rp "Do you want to install the Mail Room CLI tool? (y/n): " install_cli
if [[ "$install_cli" =~ ^[Yy]$ ]]; then
  run_additional_task "install-cli.sh"
fi

# Option to download iptables rules
read -rp "Do you want to download and set up the default iptables rules? (y/n): " setup_iptables
if [[ "$setup_iptables" =~ ^[Yy]$ ]]; then
  run_additional_task "setup-iptables.sh"
fi

# Option to generate DKIM keys
read -rp "Do you want to generate DKIM keys? (y/n): " generate_dkim
if [[ "$generate_dkim" =~ ^[Yy]$ ]]; then
  run_additional_task "generate-dkim.sh"
fi

# Option to set up an initial user
read -rp "Do you want to set up an initial mail user? (y/n): " setup_user
if [[ "$setup_user" =~ ^[Yy]$ ]]; then
  run_additional_task "setup-user.sh"
fi

# Final message
echo "Installation complete! You can now run Mail Room."
