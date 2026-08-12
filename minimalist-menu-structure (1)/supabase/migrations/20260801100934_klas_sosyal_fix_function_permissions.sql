/*
# Klas Sosyal - Fix SECURITY DEFINER function execute permissions

## Security Fix
Revoke EXECUTE on SECURITY DEFINER functions from anon role to prevent
unauthenticated users from calling privileged functions.

- add_coins: should only be callable by authenticated users (coin purchases)
- buy_game: should only be callable by authenticated users
- award_badge: should only be callable by authenticated users
- notify_on_* trigger functions: not directly callable, but revoke for safety
*/

REVOKE EXECUTE ON FUNCTION add_coins(integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION buy_game(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION award_badge(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION notify_on_like() FROM anon;
REVOKE EXECUTE ON FUNCTION notify_on_comment() FROM anon;
REVOKE EXECUTE ON FUNCTION notify_on_follow() FROM anon;