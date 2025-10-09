#!/bin/bash

# AdSense script to add
ADSENSE='    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9906225455543284"\n     crossorigin="anonymous"></script>'

# Files to process
for file in guitar_hero.html dance_revolution.html beat_drop.html snake_classic.html flappy_dragon.html bubble_pop.html lucky_dice.html candy_crush.html box_open.html ninja_slash.html chess_master.html card_battle.html brain_puzzle.html jump_master.html memory_match.html speed_racing.html whack_mole.html breakout.html pong.html maze_escape.html word_guess.html clicker_hero.html zombie_survival.html space_invaders.html balloon_pop.html doodle_jump.html number_quiz.html drum_beat.html galaxy_war.html test_points.html tower_defense.html kingdom_builder.html endless_runner.html yut_nori.html omok.html fighter_battle.html baseball_slugger.html gostop_online.html airhockey_online.html battle_tactics.html infinite_stairs.html parkour_3d.html cannon_defender.html xwing.html; do
    if [ ! -f "$file" ]; then
        echo "SKIP: $file (not found)"
        continue
    fi
    
    if grep -q "pagead2.googlesyndication.com" "$file"; then
        echo "SKIP: $file (already has AdSense)"
    else
        # Create backup
        cp "$file" "$file.bak"
        
        # Add AdSense script before <title>
        sed -i "s|<title>|$ADSENSE\n    <title>|" "$file"
        
        echo "OK: $file"
    fi
done
