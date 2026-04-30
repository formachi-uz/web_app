export type TeamFilter = {
  name: string
  query: string
  logo: string
  group: 'APL' | 'LaLiga' | 'Serie A' | 'Bundesliga' | 'Ligue 1' | 'Terma jamoalar'
}

export const teamFilters: TeamFilter[] = [
  { name: 'Real Madrid', query: 'Real Madrid', group: 'LaLiga', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
  { name: 'Barcelona', query: 'Barcelona', group: 'LaLiga', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
  { name: 'Atletico Madrid', query: 'Atletico Madrid', group: 'LaLiga', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg' },
  { name: 'Sevilla', query: 'Sevilla', group: 'LaLiga', logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg' },
  { name: 'Valencia', query: 'Valencia', group: 'LaLiga', logo: 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg' },

  { name: 'Manchester City', query: 'Manchester City', group: 'APL', logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg' },
  { name: 'Manchester United', query: 'Manchester United', group: 'APL', logo: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg' },
  { name: 'Chelsea', query: 'Chelsea', group: 'APL', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg' },
  { name: 'Liverpool', query: 'Liverpool', group: 'APL', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
  { name: 'Arsenal', query: 'Arsenal', group: 'APL', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
  { name: 'Tottenham', query: 'Tottenham', group: 'APL', logo: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg' },
  { name: 'Newcastle', query: 'Newcastle', group: 'APL', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg' },

  { name: 'Juventus', query: 'Juventus', group: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_logo.svg' },
  { name: 'Inter', query: 'Inter', group: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg' },
  { name: 'AC Milan', query: 'AC Milan', group: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg' },
  { name: 'Napoli', query: 'Napoli', group: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/S.S.C._Napoli_logo.svg' },
  { name: 'Roma', query: 'Roma', group: 'Serie A', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg' },

  { name: 'Bayern Munich', query: 'Bayern Munich', group: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg' },
  { name: 'Borussia Dortmund', query: 'Borussia Dortmund', group: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg' },
  { name: 'Bayer Leverkusen', query: 'Bayer Leverkusen', group: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg' },
  { name: 'RB Leipzig', query: 'RB Leipzig', group: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg' },
  { name: 'Eintracht Frankfurt', query: 'Eintracht Frankfurt', group: 'Bundesliga', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg' },

  { name: 'PSG', query: 'PSG', group: 'Ligue 1', logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg' },
  { name: 'Marseille', query: 'Marseille', group: 'Ligue 1', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg' },
  { name: 'Monaco', query: 'Monaco', group: 'Ligue 1', logo: 'https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg' },
  { name: 'Lyon', query: 'Lyon', group: 'Ligue 1', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c6/Olympique_Lyonnais.svg' },

  { name: 'Uzbekistan', query: 'Uzbekistan', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Flag_of_Uzbekistan.svg' },
  { name: 'Argentina', query: 'Argentina', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c1/Argentina_national_football_team_logo.svg' },
  { name: 'Brazil', query: 'Brazil', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg' },
  { name: 'Portugal', query: 'Portugal', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Portugal.svg' },
  { name: 'France', query: 'France', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg' },
  { name: 'England', query: 'England', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg' },
  { name: 'Germany', query: 'Germany', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Flag_of_Germany.svg' },
  { name: 'Spain', query: 'Spain', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Flag_of_Spain.svg' },
  { name: 'Italy', query: 'Italy', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg' },
  { name: 'Netherlands', query: 'Netherlands', group: 'Terma jamoalar', logo: 'https://upload.wikimedia.org/wikipedia/en/2/20/Flag_of_the_Netherlands.svg' },
]
