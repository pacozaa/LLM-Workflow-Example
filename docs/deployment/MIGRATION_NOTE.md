# ARM to Bicep Migration

This deployment has been upgraded from ARM templates to Bicep templates.

## Primary Files (Use These)

- **azure-template.bicep** - Main Bicep template
- **azure-parameters.bicepparam** - Bicep parameters file

## Legacy Files (Backward Compatibility)

- **azure-template.json** - Auto-generated from Bicep (for compatibility)
- **azure-parameters.json** - Legacy ARM parameters (deprecated, use .bicepparam instead)

## Why Bicep?

Bicep offers several advantages over ARM JSON:
- **Simpler syntax**: More readable and maintainable
- **Better tooling**: IntelliSense, validation, and linting
- **Modularity**: Easy to create and use modules
- **Type safety**: Compile-time validation
- **Native Azure support**: Direct integration with Azure CLI and deployment tools

## Usage

All documentation and GitHub Actions workflows have been updated to use Bicep templates.

For more information, see:
- [README.md](README.md) - Complete deployment guide
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
