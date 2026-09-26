/** 用户显示名格式化：{realname}#{id}，无 realname 时退回 #{id}。 */
const UserLabel = (() => {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /** 原始文本（未转义），用于 canvas / Chart.js legend / tooltip */
  function formatText(userId, userRecord) {
    const rn = userRecord && userRecord.realname;
    const name = rn && String(rn).trim();
    return name ? `${String(name).trim()}#${userId}` : `#${userId}`;
  }

  /** HTML 片段（已转义），用于 innerHTML */
  function format(userId, userRecord) {
    return escapeHtml(formatText(userId, userRecord));
  }

  return { format, formatText, escapeHtml };
})();