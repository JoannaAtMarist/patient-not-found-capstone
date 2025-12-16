# APP_MODE Guide

This guide explains the three operating modes of the Patient Not Found
prototype.

## Modes Overview

### **standard**

-   Real site mode\
-   MongoDB **ON**\
-   Sessions **ON**\
-   Login required\
-   Root (`/`) -> `/login`\
-   Full system available

### **dev**

-   Local developer developer mode\
-   MongoDB **ON**\
-   Sessions **ON**\
-   Login **local dev authentication stub**\
-   Root (`/`) -> `/dev-page`\
-   Entire `/client` folder exposed for testing\
-   For frontend development & rapid debugging

### **prototype**

-   Render demo mode\
-   MongoDB **OFF**\
-   Sessions **OFF**\
-   Login screen **disabled**\
-   Fake user: **Visitor (role: demo)**\
-   Root (`/`) -> `/home`\
-   Only public/demo-friendly features enabled\
-   Safe for external presentation

------------------------------------------------------------------------

## Environment Setup

Add to your `.env`:

    APP_MODE=standard

Possible values:

    APP_MODE=standard
    APP_MODE=dev
    APP_MODE=prototype

------------------------------------------------------------------------

## Render Configuration

Recommended for Render:

    APP_MODE=prototype
    MONGO_URI="mongodb://example.com:12345/disabled"

Mongo URI must exist, but prototype mode never attempts a connection.

------------------------------------------------------------------------

## Summary Table
| Mode       | Mongo | Sessions | Login     | Root Route                 | User                |
|------------|--------|----------|-----------|-----------------------------|----------------------|
| standard   | ON     | ON       | Required  | `/login` -> `/home`         | real user            |
| dev        | ON     | ON       | local-only  | `/dev-page`                | local user / none    |
| prototype  | OFF    | OFF      | Disabled  | `/home`                    | Visitor (demo)       |
------------------------------------------------------------------------

