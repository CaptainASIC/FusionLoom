#!/bin/bash

# FusionLoom Podman Socket Setup Script
# This script configures Podman to expose its API socket with proper permissions
# for use with FusionLoom without requiring sudo

echo "Setting up Podman socket for FusionLoom..."

# Create the systemd user directory if it doesn't exist
mkdir -p ~/.config/systemd/user/

# Create a socket activation file for podman
echo "Creating podman.socket systemd user file..."
cat > ~/.config/systemd/user/podman.socket << EOL
[Unit]
Description=Podman API Socket
Documentation=man:podman-system-service(1)

[Socket]
ListenStream=%t/podman/podman.sock
SocketMode=0660

[Install]
WantedBy=sockets.target
EOL

# Create a service file for podman
echo "Creating podman.service systemd user file..."
cat > ~/.config/systemd/user/podman.service << EOL
[Unit]
Description=Podman API Service
Requires=podman.socket
After=podman.socket
Documentation=man:podman-system-service(1)

[Service]
Type=simple
ExecStart=/usr/bin/podman system service

[Install]
WantedBy=default.target
EOL

# Enable and start the socket
echo "Enabling and starting podman.socket..."
systemctl --user enable podman.socket
systemctl --user start podman.socket

# Check if socket is active
if systemctl --user is-active podman.socket > /dev/null; then
    echo "Podman socket is now active and running."
else
    echo "Warning: Podman socket could not be started. Please check the logs with 'journalctl --user -u podman.socket'."
fi

# Add DOCKER_HOST environment variable to .env file
ENV_FILE="$(pwd)/.env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "DOCKER_HOST" "$ENV_FILE"; then
        # Update existing DOCKER_HOST line
        sed -i "s|DOCKER_HOST=.*|DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock|" "$ENV_FILE"
    else
        # Add DOCKER_HOST line
        echo "DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock" >> "$ENV_FILE"
    fi
    echo "Updated .env file with DOCKER_HOST environment variable."
else
    echo "Warning: .env file not found. Please run setup.sh or arch-setup.sh first."
fi

# Add DOCKER_HOST to bashrc if not already there
if ! grep -q "DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock" ~/.bashrc; then
    echo "# Added by FusionLoom for Podman socket access" >> ~/.bashrc
    echo "export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock" >> ~/.bashrc
    echo "Added DOCKER_HOST environment variable to ~/.bashrc"
    echo "Please run 'source ~/.bashrc' or start a new terminal session for the changes to take effect."
fi

echo "Podman socket setup complete!"
echo "You can now run FusionLoom with './launch.sh' without requiring sudo."
