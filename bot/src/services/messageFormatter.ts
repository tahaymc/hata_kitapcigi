import { ErrorRecord } from './apiClient';
import { BotSettings } from './settingsClient';
import { config } from '../config/env';

function stripHtml(text: any): string {
  if (text === null || text === undefined || text === '') return '';

  if (Array.isArray(text)) {
    return text.map((item) => stripHtml(item)).filter(Boolean).join('\n');
  }

  if (typeof text === 'object') {
    const parts: string[] = [];
    if (text.title) parts.push(`*${text.title}*`);
    if (text.text) parts.push(text.text);
    if (text.subSteps && Array.isArray(text.subSteps)) {
      text.subSteps.forEach((sub: any) => {
        if (sub.text) parts.push(`  • ${sub.text}`);
      });
    }
    return parts.map((p) => stripHtml(p)).filter(Boolean).join('\n');
  }

  const str = String(text);
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export interface StepContent {
  text: string;
  images: string[];
}

export class MessageFormatterService {
  static formatSuccessMessage(match: ErrorRecord, similarityScore: number): string {
    const lines: string[] = [];
    const title = stripHtml(match.title) || match.code || 'Bilinmeyen Hata';
    lines.push(`✅ *Hata bulundu:* ${title}`);

    if (match.code && match.title) {
      lines.push(`🔖 *Kod:* \`${match.code}\``);
    }

    const summary = stripHtml(match.summary);
    if (summary) {
      lines.push(`📝 *Hata Özeti:*\n${summary}`);
    }

    if (match.id != null) {
      const link = `${config.site.publicUrl}/error/${match.id}`;
      lines.push(`📖 *Detaylı çözüm, adımlar ve görseller için:*\n👉 ${link}`);
    }

    const confidencePercent = Math.min(100, Math.max(0, Math.round((1 - similarityScore) * 100)));
    lines.push(`📊 _Eşleşme oranı: %${confidencePercent}_`);

    return lines.join('\n\n');
  }

  static getDetailedSteps(match: ErrorRecord): StepContent[] {
    const raw = (match as any).solutionSteps;
    if (!raw || !Array.isArray(raw)) return [];

    return raw
      .map((step: any) => {
        const images: string[] = [];
        if (step.imageUrl && typeof step.imageUrl === 'string' && step.imageUrl.startsWith('http')) {
          images.push(step.imageUrl);
        }

        if (step.subSteps && Array.isArray(step.subSteps)) {
          step.subSteps.forEach((sub: any) => {
            if (sub.imageUrl && typeof sub.imageUrl === 'string' && sub.imageUrl.startsWith('http')) {
              images.push(sub.imageUrl);
            }
          });
        }

        let text = '';
        if (step.title) text += `*${stripHtml(step.title)}*\n`;
        if (step.text) text += stripHtml(step.text);

        if (step.subSteps && Array.isArray(step.subSteps)) {
          step.subSteps.forEach((sub: any) => {
            if (sub.text) text += `\n• ${stripHtml(sub.text)}`;
          });
        }

        return { text: text.trim(), images };
      })
      .filter((s: StepContent) => s.text || s.images.length > 0);
  }

  static getImageUrls(match: ErrorRecord): string[] {
    const urls: string[] = [];
    if (match.imageUrl && match.imageUrl.startsWith('http')) urls.push(match.imageUrl);
    if (Array.isArray(match.imageUrls)) {
      for (const u of match.imageUrls) {
        if (u && u.startsWith('http') && !urls.includes(u)) urls.push(u);
      }
    }
    return urls;
  }

  static getVideoUrl(match: ErrorRecord): string | null {
    const v = (match as any).video_url || match.videoUrl;
    return v && typeof v === 'string' && v.startsWith('http') ? v : null;
  }

  static formatFallbackMessage(settings: BotSettings): string {
    return settings.fallback_message;
  }

  static formatErrorMessage(settings: BotSettings): string {
    return settings.error_message;
  }

  static formatDisabledMessage(settings: BotSettings): string {
    return settings.disabled_message;
  }
}
