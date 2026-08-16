# Azure Runbook Tools - FinOps Dashboard

A FinOps cost management suite that visualizes Azure subscription spend in real time. It pairs a **React + Recharts** frontend with a **serverless Azure Functions** backend that queries Azure Cost Management, and ships with a library of runbooks covering deployment, security, and day-to-day operations.

## Architecture

```
┌─────────────────────────┐        ┌────────────────────────────────────┐
│  React Frontend (UI)    │  HTTP  │  Azure Functions (Serverless API)  │
│  Recharts cost charts   │ ─────► │  GetCloudCosts / ActualCost query  │
│  Hosted on Render       │        │  @azure/arm-costmanagement         │
└─────────────────────────┘        └────────────────┬───────────────────┘
                                                    │ DefaultAzureCredential
                                                    ▼
                                            ┌────────────────────┐
                                            │  Azure Subscription│
                                            │  Cost Management   │
                                            └────────────────────┘
```

- **Frontend**: `CostDashboard.jsx` renders a live monthly cost trend from the API, mapped into Recharts `BarChart` components (`index.html`, `index.js`).
- **Backend**: `GetCloudCosts` is an Azure Functions (Node.js V4 model) HTTP trigger that authenticates via `DefaultAzureCredential`, runs an `ActualCost` / `MonthToDate` usage query at daily granularity, and returns `{ date, cost }` JSON.
- **Auth**: All Azure authentication stays server-side. Credentials are never exposed to the browser. The function identity is scoped to the **Cost Management Reader** role via RBAC.

## Project Structure

```
Azure-Runbook-Tool/
├── CostDashboard.jsx          # React chart component
├── index.html                 # App shell
├── index.js                   # React entry point
├── local.settings.json        # Local Functions configuration
└── FinOps Runbook/            # Operational documentation library
    ├── FinOps Cost Runbook1               # Local setup + cloud provisioning
    ├── GetCloudCosts                       # Serverless cost API source
    ├── FinOps Containerization Docker Runbook
    ├── FinOps Docker Configuration Files Runbook
    ├── FinOps deployment onRender Runbook
    ├── deployment onRender using GitHub Actions Runbook
    ├── Managing FinOps Live Environment Runbook
    ├── FinOps Maintenance & Operations Runbook
    ├── FinOps Network Enterprise Audit Verification Runbook
    ├── FinOps Network Isolation future use Runbook
    ├── FinOps Guide for Corporate End Users Runbook
    ├── FinOps User's Role Runbook
    └── sso.tf Documentation Runbook
```

## Prerequisites

- Node.js v18 or v20
- Azure CLI
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (`npm install -g azure-functions-core-tools@4`)
- VS Code with the **Azure Account** and **Azure Functions** extensions
- Docker (for the containerized workflow)
- Terraform (for infrastructure-as-code tasks)

## Local Development

### Backend (Azure Functions)

```powershell
# 1. Initialize the project (Node.js V4 model)
& "C:\Program Files\Microsoft\Azure Functions Core Tools\func.exe" init --javascript --model V4

# 2. Create the HTTP-triggered endpoint
& "C:\Program Files\Microsoft\Azure Functions Core Tools\func.exe" new --name GetCloudCosts --template "HTTP trigger"

# 3. Install the Azure SDK packages
npm install @azure/identity @azure/arm-costmanagement

# 4. Add your subscription ID to local.settings.json, then run locally
az login
& "C:\Program Files\Microsoft\Azure Functions Core Tools\func.exe" start
```

The API will be available at `http://localhost:7071/api/GetCloudCosts`.

### Frontend (React)

Point `CostDashboard.jsx`'s `fetch()` at the local or deployed API endpoint, then run your React build/dev tooling in the `frontend/` directory.

## Deploying to Azure

```powershell
# 1. Create the resource group, storage account, and Function App
az group create --name FinOps-Backend-RG --location eastus
az storage account create --name <storage-account> --location eastus --resource-group FinOps-Backend-RG --sku Standard_LRS
az functionapp create --resource-group FinOps-Backend-RG --consumption-plan-location eastus --runtime node --runtime-version 20 --functions-version 4 --name <app-name> --storage-account <storage-account> --os-type Windows

# 2. Publish the code
& "C:\Program Files\Microsoft\Azure Functions Core Tools\func.exe" azure functionapp publish <app-name>
```

### Security hardening

```powershell
# Bind the subscription ID as an app setting
az functionapp config appsettings set --name <app-name> --resource-group FinOps-Backend-RG --settings AZURE_SUBSCRIPTION_ID="<your-subscription-id>"

# Enable a system-assigned managed identity
az functionapp identity assign --name <app-name> --resource-group FinOps-Backend-RG

# Grant least-privilege access (read-only on cost data)
az role assignment create --assignee "<principalId>" --role "Cost Management Reader" --scope "/subscriptions/<your-subscription-id>"

# Whitelist only the production frontend origin
az functionapp cors add --name <app-name> --resource-group FinOps-Backend-RG --allowed-origins "https://<your-frontend-domain>"
```

## Containerization

The application is split into two containers managed by `docker-compose.yml`:

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| Frontend | multi-stage: `node:22-alpine` build → `nginx:alpine` host | 3000 | Serves compiled React assets |
| Backend | `node:22-alpine` | 3001 | Azure Functions API |

```bash
docker compose up --build   # launch
docker compose down         # clean teardown
```

## Deployment to Render

- **Frontend**: Deploy as a **Static Site** with `Root Directory: frontend`, `Build Command: npm install && npm run build`, `Publish Directory: dist`.
- **Backend**: Deploy as a **Web Service** and inject `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` as environment variables (use `MOCK_DATA=true` for demo data).
- **CI/CD**: See `deployment onRender using GitHub Actions Runbook` for a workflow that runs tests on push and triggers Render via a `RENDER_DEPLOY_HOOK` secret.

## Infrastructure as Code

The `infrastructure/` folder contains Terraform definitions (including SSO configuration) used to manage identity and role assignments:

```bash
cd infrastructure
terraform plan      # preview changes
terraform apply     # apply changes
terraform output sso_client_id
terraform output sso_client_secret
```

## Network Isolation

For enterprise deployments, network isolation restricts access to the corporate network or VPN. See the runbooks in `FinOps Runbook/` for the Render Private Space configuration, audit verification steps, and end-user access guidance.

## Security Notes

- Azure credentials and SDKs are server-side only; never move them into the React frontend.
- The Function App uses a managed identity scoped to **Cost Management Reader** (read-only) — be cautious when granting broader roles such as Contributor, as dashboard features can modify virtual machines.
- Keep the `RENDER_DEPLOY_HOOK` and any client secrets in GitHub repository secrets / Render environment variables, never in source control.

## Runbooks

Full step-by-step guides for setup, deployment, maintenance, and user access live in the [`FinOps Runbook`](FinOps%20Runbook/) directory.
