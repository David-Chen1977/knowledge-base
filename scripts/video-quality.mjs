/**
 * video-quality.mjs — 视频质量等级配置
 * 原引用 video-hyperframes，现已迁移到 ppt_to_video.py
 */
export const TIERS = {
  S: { label: 'S — 极致画质', engine: 'hyperframes' },
  A: { label: 'A — 高清', engine: 'ppt_to_video' },
  B: { label: 'B — 标准', engine: 'ppt_to_video' },
  C: { label: 'C — 快速', engine: 'ppt_to_video' },
};

export function resolveVideoQuality(level) {
  const tier = TIERS[level] || TIERS.A;
  return { config: tier };
}

export function buildHyperFramesArgs(vq) {
  return '--quality standard';
}
