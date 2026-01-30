# WeChat Pay Certificates Directory

This directory is used to store WeChat Pay API certificates and private keys.

## Required Files

### apiclient_key.pem (REQUIRED)
Your WeChat Pay API v3 private key. This file should:
- Be in PEM format
- Contain the private key without password protection
- Be kept confidential and never committed to version control

## How to Obtain

1. Log in to the [WeChat Pay Merchant Platform](https://pay.weixin.qq.com/)
2. Go to: Account Center > API Certificates
3. Download your API certificate and private key
4. Place the private key file here as `apiclient_key.pem`

## Security Notes

⚠️ **IMPORTANT:**
- Never commit this directory or its contents to version control
- This directory is already gitignored
- Ensure file permissions are restricted (chmod 600)
- Rotate certificates periodically for security

## File Structure

```
certs/
├── apiclient_key.pem          # Your WeChat Pay API v3 private key
└── README.md                   # This file
```

## Environment Variable Reference

The path to this directory is configured via:
- `WECHAT_PAY_PRIVATE_KEY_PATH` (default: `certs/apiclient_key.pem`)
