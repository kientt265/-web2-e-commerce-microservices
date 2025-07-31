# Contributing: Adding a New Service

Thank you for your interest in contributing to this project! Follow these steps to add a new microservice:

## 1. Create Your Service
- Place your service code in a new directory under `back/src/` (e.g., `back/src/my-new-service`).
- Include a `Dockerfile` and, if needed, a `requirements.txt` or `package.json` for dependencies.

## 2. Expose the Service
- Ensure your service listens on a configurable port (use the `PORT` environment variable if possible).
- Expose the port in your Dockerfile (e.g., `EXPOSE 3002`).

## 3. Update `docker-compose.yml`
- Add a new service block for your microservice.
- Set the `build` context and `dockerfile` path.
- Map the internal port to a host port if you want to access it directly.
- Add your service to the `chat-network` network.

## 4. Update the API Gateway (Nginx)
- Edit `back/src/gateway/conf.d/default.conf`.
- Add a new `upstream` block for your service:
  ```nginx
  upstream my_new_service_backend {
      server my-new-service:YOUR_PORT;
  }
  ```
- Add a new `location` block in the `server` section to route requests:
  ```nginx
  location /api/my-new-service/ {
      proxy_pass http://my_new_service_backend/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

## 5. Test Your Service
- Rebuild and restart the project:
  ```sh
  docker-compose up --build
  ```
- Test your new endpoint via the API gateway:
  ```sh
  curl http://localhost/api/my-new-service/health
  ```

## 6. Documentation
- Add a `README.md` in your service directory describing its purpose, endpoints, and usage.

## 7. Submit a Pull Request
- Ensure your code is clean and well-documented.
- Open a pull request with a clear description of your changes.

---

If you have any questions, feel free to open an issue or ask in the discussions!
