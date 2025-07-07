FROM ollama/ollama:0.7.0

# Qwen2.5:1.5b - Docker
ENV API_BASE_URL=https://4qvrhtl5tvy69ca2veau9dxhpt43lbpofdjbu6r21wvv.node.k8s.prd.nos.ci/api

ENV MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b

ENV PERPLEXITY_API_KEY=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
ENV NEWS_API_KEY=83f4281327a74bb8b6fd974c91f90791
# Qwen2.5:32b = Docker
# ENV API_BASE_URL=http://127.0.0.1:11434/api
# ENV MODEL_NAME_AT_ENDPOINT=qwen2.5:32b

# Install system dependencies and Node.js
RUN apt-get update && apt-get install -y \
  curl \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY .env.docker package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the project
RUN pnpm run build

# Override the default entrypoint
ENTRYPOINT ["/bin/sh", "-c"]

# Start Ollama service and pull the model, then run the app
CMD ["ollama serve & sleep 5 && ollama pull ${MODEL_NAME_AT_ENDPOINT} && pnpm run dev"]
