import { Injectable } from '@angular/core';
import { Guide } from '../models/guide.model';
import { GUIDES } from '../data/guides.data';

@Injectable({
  providedIn: 'root'
})
export class GuideService {
  private guides: Guide[] = GUIDES;

  constructor() {}

  async searchGuides(query: string): Promise<Guide[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    return this.guides.filter(guide => 
      guide.active && (
        guide.first_name.toLowerCase().includes(searchTerm) || 
        guide.last_name.toLowerCase().includes(searchTerm)
      )
    );
  }

  async getGuidesByIds(ids: string[]): Promise<Guide[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.guides.filter(guide => ids.includes(guide.id));
  }

  getAllGuides(): Guide[] {
    return this.guides.filter(guide => guide.active);
  }
}
