# 🐳 Docker Setup Guide

You can run the entire application (Frontend + Backend) without manually installing `npm` modules using Docker.

## Prerequisites
-   [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

## How to Run

1.  **Open Terminal** in the project root folder.
2.  **Start the App**:
    ```bash
    docker-compose up --build
    ```
    *(The configuration automatically uses the `.env` file from the `server` folder).*

3.  **Access the App**:
    -   **Frontend**: [http://localhost:5173](http://localhost:5173)
    -   **Backend**: [http://localhost:5000](http://localhost:5000)

## How to Share (For You)
To send this to your friend:
1.  **Zip the contents** of this folder.
    *   **IMPORTANT:** Make sure the `server/.env` file is included! (It contains your secrets).
    *   You can delete `node_modules` folders (in `client` and `server`) to make the zip smaller.
2.  Send the Zip.
3.  Your friend just unzips it and runs `docker-compose up`.
