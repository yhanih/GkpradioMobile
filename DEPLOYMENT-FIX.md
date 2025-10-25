# Deployment Fix - August 6, 2025

## Issue Fixed
The GitHub Actions deployment was failing because:
- Error: `protocol: invalid parameter - you provided "sftp"`
- The FTP-Deploy-Action doesn't support "sftp" protocol

## Solution Applied
- Changed protocol from `sftp` to `ftps` (secure FTP)
- FTPS is supported by IONOS and the deployment action
- This maintains security while fixing the connection issue

## Status: Ready for re-deployment test