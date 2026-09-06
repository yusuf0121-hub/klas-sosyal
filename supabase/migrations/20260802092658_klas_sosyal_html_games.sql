/*
# Klas Sosyal - HTML games support

## Changes
1. Games table: add html_content column for user-submitted HTML game code
2. Keep slug for backwards compat with built-in games
*/

ALTER TABLE games ADD COLUMN IF NOT EXISTS html_content text;

-- Community games created with custom HTML use slug 'custom'
-- Built-in games (snake, tictactoe, memory, flappy) keep their original slug