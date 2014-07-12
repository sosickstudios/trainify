# Install primary modules.
ansible-playbook provision.yml -i hosts

# Install GitCrypt modules.
ansible-playbook gitcrypt.yml -i hosts

# Install NGINX configuration.
ansible-playbook nginx.yml -i hosts

# Deploy the latest code.
ansible-playbook deploy.yml -i hosts