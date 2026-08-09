# Troubleshooting

Common issues and their solutions.

## Wallet Won't Unlock

**Problem:** BeetVault rejects your password.

**Solutions:**
- Verify Caps Lock is off
- Check that you're using the password for this specific wallet (not a different backup)
- If you recently restored from backup, ensure you used the original wallet's password

## Transaction Fails to Broadcast

**Problem:** Signed transaction returns an error or times out.

**Solutions:**
- Check your internet connection
- Verify the blockchain node is responding (try switching to a different node)
- Ensure your account has sufficient balance for the operation + fees
- Check that your account has the required authority (active/owner) for the operation

## Node Connection Issues

**Problem:** BeetVault cannot connect to the blockchain.

**Solutions:**
1. Open **Settings → Change Nodes**
2. Try a different node from the dropdown
3. If all nodes fail, check your firewall/proxy settings
4. Test the node URL in a browser (it should return JSON data)

## Modal Window Doesn't Appear

**Problem:** Clicking a deeplink or QR code doesn't show the transaction prompt.

**Solutions:**
- Ensure BeetVault is fully unlocked (not on the lock screen)
- Check that no other modal is already open
- Verify you are on the matching wallet page (TOTP links require the TOTP page, raw links require the Raw Deeplink page)
- Restart BeetVault and try again

## Deeplink Doesn't Launch the Wallet

**Problem:** Clicking a deeplink in your browser does nothing at all — the wallet never opens.

**Solutions:**
- **Check the URL length.** Chromium-based browsers (Chrome, Edge, Brave, Opera) silently drop URLs longer than roughly 2,048 characters. Large transactions frequently exceed this.
- Ask the dApp to use the [JSON File](./deeplinks/json-file/overview.md) method instead — file uploads have no size limit
- Confirm BeetVault is registered as the protocol handler for `beetvault://` on your system
- Try the link in a different browser to rule out a browser-specific issue

## QR Code Won't Scan

**Problem:** The camera cannot read the QR code, or scanning produces no result.

**Solutions:**
- **Try the drag or upload methods instead.** These read the QR from an image file rather than a camera, bypassing optical scanning limits entirely — often the fastest fix.
- The code may be too dense — large payloads produce high-version QR codes with fine module patterns that cameras struggle to resolve
- Improve lighting, reduce screen glare, and hold the camera steady at the right distance
- Display the code larger on the source screen, if possible
- Ask the dApp to use the [JSON File](./deeplinks/json-file/overview.md) method for large transactions

## Backup/Restore Failures

**Problem:** Cannot create or restore a backup file.

**Solutions:**
- Verify you have write permissions to the backup location
- Ensure you're using the correct password for the backup file
- Check that the file wasn't corrupted during transfer
- Try downloading the backup signature again (requires internet)

## Error Windows

If BeetVault encounters an error:

1. An error window will appear with details
2. Use the **Copy** button to save error details
3. Include these details when seeking support
4. The error window persists even if you log out — you can close it anytime

## Still Need Help?

If your issue isn't listed here:

- Search the [FAQ](./faq.md)
- Check existing GitHub issues
- Open a new GitHub issue with:
  - BeetVault version
  - Operating system
  - Steps to reproduce
  - Error window details (if any)
