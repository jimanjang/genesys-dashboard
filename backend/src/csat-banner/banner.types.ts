export interface BannerMessage {
  type: 'excellent_comment' | 'five_star' | 'cheer';
  text: string;
  agentName?: string;
  comment?: string;
  priority: 1 | 2 | 3;
}

export const CHEER_MESSAGES: BannerMessage[] = [
  {
    type: 'cheer',
    text: '오늘도 우리 팀의 친절한 응대 덕분에 서비스가 빛나고 있어요! ✨',
    priority: 3,
  },
  {
    type: 'cheer',
    text: '당근 서비스는 여러분의 따뜻한 상담을 응원합니다. 🧡',
    priority: 3,
  },
  {
    type: 'cheer',
    text: '따뜻한 상담을 만드는 여러분, 오늘도 화이팅이에요!',
    priority: 3,
  },
];
