import { Component, Input, Output, EventEmitter, forwardRef, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

export interface MultiInputItem {
  id: string;
  label: string;
  subLabel?: string;
  originalItem: any;
}

@Component({
  selector: 'app-multi-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multi-input.component.html',
  styleUrl: './multi-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiInputComponent),
      multi: true
    }
  ]
})
export class MultiInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = 'Pretražite...';
  @Input() searchResults: MultiInputItem[] = [];
  @Input() isSearching: boolean = false;
  
  @Output() search = new EventEmitter<string>();

  selectedItems = signal<MultiInputItem[]>([]);
  showDropdown = signal(false);
  searchTerm = '';

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.search.emit(value);
    this.showDropdown.set(value.length >= 2);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.searchResults.length > 0) {
        this.selectItem(this.searchResults[0]);
      }
    }
  }

  selectItem(item: MultiInputItem): void {
    if (!this.selectedItems().some(i => i.id === item.id)) {
      const newItems = [...this.selectedItems(), item];
      this.selectedItems.set(newItems);
      this.updateFormValue();
    }
    this.searchTerm = '';
    this.showDropdown.set(false);
    this.search.emit('');
    this.searchInput.nativeElement.focus();
  }

  removeItem(item: MultiInputItem): void {
    const newItems = this.selectedItems().filter(i => i.id !== item.id);
    this.selectedItems.set(newItems);
    this.updateFormValue();
  }

  private updateFormValue(): void {
    this.onChange(this.selectedItems().map(i => i.id));
  }

  // ControlValueAccessor methods
  writeValue(value: string[]): void {
    // Note: We might need to map IDs back to items if we want to support initial values
    // but for now we focus on the selection flow from the UI.
    // If the value comes from outside, we'll need a way to look up the labels.
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  hideDropdown(): void {
    // Delay to allow click to fire on dropdown item
    setTimeout(() => {
      this.showDropdown.set(false);
    }, 200);
  }
}
