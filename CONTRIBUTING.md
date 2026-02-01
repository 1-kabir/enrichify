# Contributing to Enrichify

Thank you for your interest in contributing to Enrichify! We appreciate your help in making this open-source project even better.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Pull Request Process](#pull-request-process)
- [Style Guides](#style-guides)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

## How to Contribute

There are many ways you can contribute to Enrichify:

- Report bugs and suggest features through [GitHub Issues](https://github.com/your-username/enrichify/issues)
- Submit pull requests with bug fixes or new features
- Improve documentation
- Review pull requests from other contributors
- Share the project with others

## Development Setup

### Prerequisites

- Docker & Docker Compose v2
- Node.js (v18 or higher)
- npm or yarn

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/enrichify.git
   cd enrichify
   ```
3. Install dependencies for both frontend and backend:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
4. Set up environment variables (copy `.env.example` to `.env` and fill in values)
5. Start the development environment:
   ```bash
   docker-compose up -d
   ```

### Project Structure

```
enrichify/
├── docker-compose.yml          # Docker orchestration
├── frontend/                   # Next.js frontend application
│   ├── app/                    # App Router pages
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utility functions
│   ├── public/                 # Static assets
│   └── package.json            # Dependencies
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── app.module.ts       # Main application module
│   │   ├── main.ts             # Application entry point
│   │   ├── controllers/        # API controllers
│   │   ├── services/           # Business logic services
│   │   └── entities/           # Database entities
│   └── package.json            # Dependencies
├── shared/                     # Shared types and utilities
└── docker/
    ├── postgres/               # PostgreSQL configuration
    └── redis/                  # Redis configuration for BullMQ
```

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### TypeScript Style Guide

- Follow the existing code style in the project
- Use TypeScript for type safety
- Use Biome for code formatting and linting
- Write meaningful variable and function names
- Add JSDoc comments for exported functions and classes

### Frontend Style Guide

- Use Tailwind CSS for styling
- Follow shadcn/ui component patterns
- Use React hooks appropriately
- Follow Next.js best practices for routing and data fetching

### Backend Style Guide

- Follow NestJS best practices
- Use dependency injection where appropriate
- Structure code in modules, controllers, and services
- Use TypeORM for database operations
- Implement proper error handling

## Questions?

If you have any questions about contributing, feel free to reach out by opening an issue in the repository.