# acumatica-uss-fence
Low code/no code customization package for managing and migrating Acumatica customizations specific to USS.  Dependent upon Rental360

This section provides instructions on setting up environment variables, building, and deploying the project.

## Environment Setup

To set up the environment for building and deploying the `acumatica-uss-fence` project, you need to create a `.env` file in the root directory of your project with the following variables:

```env
# Acumatica credentials
AC_USERNAME=your_acumatica_username
AC_PASSWORD=your_acumatica_password
AC_TENANT=your_acumatica_tenant
AC_BRANCH=your_acumatica_branch
AC_BASE_URL=your_acumatica_base_url

# Project details
PROJECT_NAME=USSFence
PROJECT_DESCRIPTION="Low code/no code customization package for managing and migrating Acumatica customizations specific to USS. Dependent upon Rental360"
PROJECT_LEVEL=250

# Version (Needs to be updated in package.json for each build)
npm_package_version=1.25.2.1
```
