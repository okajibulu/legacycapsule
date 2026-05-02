# LegacyCapsule Project Context

## Project Overview
LegacyCapsule is a tribute web app where users submit messages tied to a capsule.
Each tribute includes:
- name
- email
- city
- country
- message (content)

## Core Rules
- Email represents identity (lightweight ownership system)
- Admin has elevated privileges (approve + edit)
- Users can:
  - submit tributes
  - edit ONLY their own pending tributes
- Only approved tributes are visible to other users

## UI Structure (STRICT)
The main file is:
app/capsule/[slug]/page.tsx

The file is divided into SECTIONS.

IMPORTANT:
- Every change MUST be done section-by-section
- NEVER modify the whole file
- NEVER insert logic inside JSX
- NEVER use (() => {}) patterns

## Layout Rules
- Header + Form are FIXED (non-scrollable)
- Tribute Wall is SCROLLABLE
- Compact UI (minimal padding)

## Current Features
- Submission form (validated)
- Country searchable dropdown
- Admin approval system
- Edit system (restricted)
- Pending visibility rules

## Coding Rules
- Keep logic OUTSIDE JSX
- Use clean variables before return()
- Avoid nested conditions inside JSX
- Keep sections small and replaceable

## Output Rules for AI
- Always return FULL section replacement
- Never return partial edits
- Do not touch unrelated sections
- Keep JSX balanced (no missing tags)

## Current Goal
- Improve admin experience
- Strengthen ownership system
- Maintain stability (no breaking structure)