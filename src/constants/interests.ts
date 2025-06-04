export const VALID_INTERESTS = [
    "Gospel playlists",
    "Sermons",
    "Community",
    "Prayer wall & pray for me",
    "Connect with my church members",
    "Kids games",
    "Bible stories for Kids",
    "Christian books",
    "Animated christian videos",
  ] as const;
  
  export type InterestType = (typeof VALID_INTERESTS)[number];
  