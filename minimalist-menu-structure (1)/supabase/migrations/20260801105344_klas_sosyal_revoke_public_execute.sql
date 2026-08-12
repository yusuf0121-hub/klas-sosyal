/*
# Klas Sosyal - Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC

The previous REVOKE from anon was not sufficient because PostgreSQL
grants EXECUTE to PUBLIC by default. Revoke from PUBLIC and re-grant
only to authenticated.
*/

REVOKE EXECUTE ON FUNCTION add_coins(integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION buy_game(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION award_badge(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION notify_on_like() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION notify_on_comment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION notify_on_follow() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION buy_game(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION award_badge(integer) TO authenticated;