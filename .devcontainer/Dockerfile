FROM mcr.microsoft.com/devcontainers/javascript-node:0-20

# Install xdg-utils so attempts to open a browser have a helper available
RUN apt-get update \
  && apt-get install -y --no-install-recommends xdg-utils \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Set working directory to the workspace folder inside the container
WORKDIR /workspaces/voidwriter

CMD ["sleep", "infinity"]
