import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  Trip,
  TripType,
  SECTIONS,
  TRANSPORT_METHODS,
  FITNESS_DIFFICULTIES,
  TECHNICAL_DIFFICULTIES
} from '../../../core/models/trip.model';
import { Guide } from '../../../core/models/guide.model';
import { GuideService } from '../../../core/services/guide.service';
import { MultiInputComponent, MultiInputItem } from '../../../shared/components/multi-input/multi-input.component';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MultiInputComponent],
  templateUrl: './trip-form.component.html',
  styleUrl: './trip-form.component.scss'
})
export class TripFormComponent implements OnInit, OnDestroy {
  tripForm!: FormGroup;
  private destroy$ = new Subject<void>();

  // Guide autocomplete data for MultiInput
  guideSearchResults: MultiInputItem[] = [];
  isSearchingGuides = false;

  readonly sections = SECTIONS;
  readonly transportMethods = TRANSPORT_METHODS;
  readonly fitnessDifficulties = FITNESS_DIFFICULTIES;
  readonly technicalDifficulties = TECHNICAL_DIFFICULTIES;

  constructor(
    private fb: FormBuilder,
    private guideService: GuideService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.watchTripType();
    this.watchDateChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.tripForm = this.fb.group({
      tripType: ['single-day', Validators.required],
      tripDate: [''],
      startDate: [''],
      endDate: [''],
      tripName: ['', Validators.required],
      guides: [[]],
      departure: ['', Validators.required],
      section: ['', Validators.required],
      transport: ['', Validators.required],
      fitnessDifficulty: ['', Validators.required],
      technicalDifficulty: ['', Validators.required],
      memberPrice: [0, [Validators.required, Validators.min(0)]],
      nonMemberPrice: [0, [Validators.required, Validators.min(0)]],
      food: ['', Validators.required],
      returnInfo: ['', Validators.required],
      description: [''],
      dayDescriptions: this.fb.array([]),
      notes: ['']
    });
  }

  private watchTripType(): void {
    this.tripForm.get('tripType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: TripType) => {
        this.clearDayDescriptions();
        if (type === 'single-day') {
          this.tripForm.patchValue({ startDate: '', endDate: '' });
        } else {
          this.tripForm.patchValue({ tripDate: '', description: '' });
        }
      });
  }

  private watchDateChanges(): void {
    this.tripForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateDayDescriptions());

    this.tripForm.get('endDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateDayDescriptions());
  }

  async onGuideSearch(term: string): Promise<void> {
    if (term.length < 2) {
      this.guideSearchResults = [];
      return;
    }

    this.isSearchingGuides = true;
    const results = await this.guideService.searchGuides(term);
    
    // Map to MultiInputItem
    const selectedIds = this.tripForm.get('guides')?.value as string[];
    this.guideSearchResults = results
      .filter(g => !selectedIds.includes(g.id))
      .map(g => ({
        id: g.id,
        label: `${g.first_name} ${g.last_name}`,
        subLabel: g.category,
        originalItem: g
      }));
    
    this.isSearchingGuides = false;
  }

  get isSingleDay(): boolean {
    return this.tripForm.get('tripType')?.value === 'single-day';
  }

  get isMultiDay(): boolean {
    return this.tripForm.get('tripType')?.value === 'multi-day';
  }

  get dayDescriptions(): FormArray {
    return this.tripForm.get('dayDescriptions') as FormArray;
  }

  private clearDayDescriptions(): void {
    while (this.dayDescriptions.length) {
      this.dayDescriptions.removeAt(0);
    }
  }

  private updateDayDescriptions(): void {
    if (!this.isMultiDay) return;

    const startDate = this.tripForm.get('startDate')?.value;
    const endDate = this.tripForm.get('endDate')?.value;

    if (!startDate || !endDate) {
      this.clearDayDescriptions();
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      this.clearDayDescriptions();
      return;
    }

    const days: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const existingDescriptions = this.dayDescriptions.controls.map(c => ({
      date: c.get('date')?.value,
      description: c.get('description')?.value
    }));

    this.clearDayDescriptions();

    days.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      const existing = existingDescriptions.find(d => d.date === dateStr);
      this.dayDescriptions.push(this.fb.group({
        date: [dateStr],
        description: [existing?.description || '']
      }));
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hr-HR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  onSubmit(): void {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const formValue = this.tripForm.value;
    const trip: Trip = {
      tripType: formValue.tripType,
      tripName: formValue.tripName,
      guides: formValue.guides,
      departure: formValue.departure,
      section: formValue.section,
      transport: formValue.transport,
      fitnessDifficulty: formValue.fitnessDifficulty,
      technicalDifficulty: formValue.technicalDifficulty,
      memberPrice: formValue.memberPrice,
      nonMemberPrice: formValue.nonMemberPrice,
      food: formValue.food,
      returnInfo: formValue.returnInfo,
      notes: formValue.notes || undefined
    };

    if (formValue.tripType === 'single-day') {
      trip.tripDate = formValue.tripDate;
      trip.description = formValue.description;
    } else {
      trip.startDate = formValue.startDate;
      trip.endDate = formValue.endDate;
      trip.dayDescriptions = formValue.dayDescriptions;
    }

    console.log('Trip JSON:', JSON.stringify(trip, null, 2));
  }
}
