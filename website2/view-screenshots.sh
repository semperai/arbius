#!/bin/bash

# Helper script to view screenshots for Claude Code

echo "=== Available Screenshots ==="
ls -lh screenshots/ 2>/dev/null || echo "No screenshots yet. Run: npm run test:screenshots"
echo ""
echo "=== Screenshot Summary ==="
echo "Total screenshots: $(ls screenshots/ 2>/dev/null | wc -l)"
echo ""
echo "To view a specific screenshot:"
echo "  open screenshots/homepage-full.png"
echo ""
echo "To view all screenshots:"
echo "  open screenshots/"
