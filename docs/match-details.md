# Match Details Page Feature

## Overview
A comprehensive Match Details page that displays full match information with team breakdowns, player statistics, and CIR calculations. Accessible from any match display location in the app.

## Route
- **Path**: `/match/[matchId]`
- **Example**: `/match/NA1_4971234567`

## Components Created

### 1. **MatchHeader** (`app/components/match/MatchHeader.tsx`)
Displays match metadata and team results:
- Match date and time
- Game duration
- Game mode
- Victory/Defeat status for both teams (Blue/Red)

### 2. **MatchTeamTable** (`app/components/match/MatchTeamTable.tsx`)
Detailed team breakdown table showing:
- **Player Info**: Champion icon, player name (clickable to player page), role
- **KDA**: Individual K/D/A and ratio with color coding
- **Damage**: Total damage and damage per minute
- **Gold**: Total gold earned and gold per minute
- **CS**: Total CS and CS per minute
- **Vision**: Vision score and vision per minute
- **CIR**: Competitive Impact Rating with tier badge
- **Items**: All 7 item slots displayed

**Features**:
- Sorted by CIR (highest to lowest)
- Color-coded by team result (emerald for win, red for loss)
- Hover effects on rows
- Clickable player names redirect to player pages

### 3. **MatchStats** (`app/components/match/MatchStats.tsx`)
Team comparison statistics:
- **Kills**: Visual bar comparison
- **Damage**: Total damage comparison
- **Gold**: Total gold comparison
- **Vision Score**: Team vision comparison
- **Towers**: Towers destroyed
- **Dragons**: Dragons secured (grid display)
- **Barons**: Barons secured (grid display)

## Database Function Added

### `getMatchById(matchId: string)`
- **Location**: `app/lib/db.ts`
- **Purpose**: Fetches a single match from the database by matchId
- **Caching**: Uses `unstable_cache` with 900s revalidation
- **Returns**: Match object or null if not found

## Navigation Links Added

### 1. **Player Page** - `MatchHistoryList.tsx`
- Each match row is now a clickable Link
- Redirects to `/match/[matchId]`
- Maintains hover states and visual feedback

### 2. **Team Analytics** - `GroupMatchHistory.tsx`
- Group match cards are clickable Links
- Redirects to `/match/[matchId]`
- Shows which team members played together

### 3. **Records Page** - `CirLeaderboardCard.tsx`
- CIR leaderboard entries have overlay Link
- Clicking anywhere on the card (except expand button) navigates to match
- Expand button still works independently (z-index layering)

### 4. **Records Page** - `PentakillCard.tsx`
- Pentakill cards are fully clickable Links
- Redirects to the match where the pentakill occurred
- Hover effect added

## Design Philosophy

### League of Graphs Inspiration
- **Table-based layout**: Clean, scannable team tables
- **Comprehensive stats**: All relevant player statistics visible
- **Visual hierarchy**: Clear separation between teams
- **Color coding**: Consistent win/loss color scheme

### App Style Consistency
- **Zinc color palette**: Matches existing dark theme
- **Border styling**: `border-zinc-800` with subtle backgrounds
- **Backdrop blur**: `backdrop-blur-sm` for depth
- **Rounded corners**: `rounded-xl` for modern feel
- **Hover states**: Subtle transitions on interactive elements
- **Typography**: Consistent font sizes and weights

## User Experience

### Desktop-First
- **Cursor pointers**: All clickable elements have `cursor-pointer` class
- **Wide tables**: Optimized for desktop viewing with horizontal scroll on mobile
- **Fixed column widths**: Ensures consistent alignment

### Navigation Flow
1. User sees match in any location (player page, records, team analytics)
2. Clicks on match row/card
3. Navigates to `/match/[matchId]`
4. Views full match details with team breakdowns
5. Can click player names to view their profiles
6. "Back to Dashboard" link at top for easy navigation

## Technical Details

### Data Flow
1. **Route**: `/match/[matchId]/page.tsx` receives matchId param
2. **Fetch**: `getMatchById(matchId)` retrieves match from SQLite database
3. **Type Cast**: Match data cast to `Match` type for TypeScript safety
4. **Team Split**: Participants filtered into team100 and team200
5. **CIR Calculation**: Each participant's CIR computed in MatchTeamTable
6. **Render**: Components receive match data and display information

### Performance
- **Server-side rendering**: Match page is server component
- **Database caching**: `unstable_cache` with 900s revalidation
- **Efficient queries**: Single SQL query to fetch match by ID
- **Image optimization**: DDragon CDN for champion icons and items

### Type Safety
- All components properly typed with TypeScript
- Match interface from `app/types/riot.ts`
- Proper type assertions for database queries

## Files Modified/Created

### Created
- `app/match/[matchId]/page.tsx` - Main match page route
- `app/components/match/MatchHeader.tsx` - Match header component
- `app/components/match/MatchTeamTable.tsx` - Team table component
- `app/components/match/MatchStats.tsx` - Match statistics component
- `app/components/match/MatchFeature.md` - This documentation

### Modified
- `app/lib/db.ts` - Added `getMatchById` function
- `app/components/player/MatchHistoryList.tsx` - Added Link navigation
- `app/components/team/GroupMatchHistory.tsx` - Added Link navigation
- `app/components/records/CirLeaderboardCard.tsx` - Added Link navigation
- `app/components/records/PentakillCard.tsx` - Added Link navigation

## Future Enhancements (Optional)
- Match timeline visualization
- Rune and summoner spell displays
- Damage breakdown charts
- Gold difference over time graph
- Build path analysis
- Post-match chat/notes feature
