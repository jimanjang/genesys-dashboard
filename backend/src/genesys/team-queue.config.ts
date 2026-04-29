// Team-to-queue configuration registry
// Exact queue names as they appear in Genesys Cloud (verified 2026-04-17)

export const TEAM_QUEUE_CONFIG = {
  pay: {
    teamId: 'pay',
    teamName: '페이팀',
    queues: {
      generalLine: {
        label: '일반내선',
        queueName: '당근 페이 관련 문의',         // ✅ confirmed
        mediaTypes: ['voice'],
      },
      financialFraud: {
        label: '금융피해 신고센터',
        queueName: '당근페이 금융피해 신고센터',    // ✅ confirmed
        mediaTypes: ['voice', 'callback', 'chat', 'email', 'message'],
      },
      directBuy: {
        label: '바로구매',
        queueName: '당근 페이_바로 구매 문의',      // ✅ confirmed
        mediaTypes: ['voice', 'callback', 'chat', 'email', 'message'],
      },
    },
    agentTeam: '페이',
  },

  bizOps: {
    teamId: 'biz-ops',
    teamName: '사업 운영팀',
    queues: {
      // Ads Group (3)
      ads1: {
        label: '광고 노출/성과',
        queueName: '당근 비즈니스센터_광고 노출/성과',
        mediaTypes: ['voice'],
      },
      ads2: {
        label: '신규 광고 신청',
        queueName: '당근 비즈니스센터_신규 광고 신청',
        mediaTypes: ['voice'],
      },
      ads3: {
        label: '광고 호전환',
        queueName: '당근 비즈니스센터_광고 호전환',
        mediaTypes: ['voice'],
      },
      // Biz Group (7)
      biz1: {
        label: '비즈프로필 오류',
        queueName: '당근 비즈니스센터_비즈프로필 오류 문의 및 그 외',
        mediaTypes: ['voice'],
      },
      biz2: {
        label: '비즈프로필 이용',
        queueName: '당근 비즈니스센터_비즈프로필 이용 관련 문의',
        mediaTypes: ['voice'],
      },
      biz3: {
        label: '비즈프로필 제재',
        queueName: '당근 비즈니스센터_비즈프로필 제재',
        mediaTypes: ['voice'],
      },
      biz4: {
        label: '비즈프로필 이용제재',
        queueName: '당근 비즈니스센터_비즈프로필 이용제재',
        mediaTypes: ['voice'],
      },
      biz5: {
        label: '포장주문',
        queueName: '당근 비즈니스센터_포장주문',
        mediaTypes: ['voice'],
      },
      biz6: {
        label: 'QR서비스',
        queueName: '당근 비즈니스센터_QR서비스',
        mediaTypes: ['voice'],
      },
      biz7: {
        label: '비즈프로필 호전환',
        queueName: '당근 비즈니스센터_비즈프로필 호전환',
        mediaTypes: ['voice'],
      },
    },
    agentTeams: ['광고', '사업', '비즈'],
  },

  alba: {
    teamId: 'alba',
    teamName: '당근알바팀',
    queues: {
      albaGeneral: {
        label: '당근알바 일반문의',
        queueName: '당근알바 고객센터 일반문의',       // ✅ confirmed
        mediaTypes: ['voice'],
      },
      albaPaid: {
        label: '당근알바 유료상품',
        queueName: '당근알바 고객센터 유료 상품 문의',  // ✅ confirmed
        mediaTypes: ['voice'],
      },
    },
    agentTeam: '알바',
  },

  // Looker-only teams — Genesys data NOT needed
  adReview: {
    teamId: 'ad-review',
    teamName: '광고심사팀',
    lookerOnly: true,
  },
  bizReview: {
    teamId: 'biz-review',
    teamName: '비즈심사팀',
    lookerOnly: true,
  },
  dispute: {
    teamId: 'dispute',
    teamName: '대외민원/분쟁조정',
    lookerOnly: true,
  },
  secondhand: {
    teamId: 'secondhand',
    teamName: '중고거래팀',
    lookerOnly: true,
  },
} as const;
