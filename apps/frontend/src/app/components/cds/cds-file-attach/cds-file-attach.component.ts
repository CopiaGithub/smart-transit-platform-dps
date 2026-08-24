import {
  Component,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { ControlValueAccessorDirective } from '../../directive';
import { CdsLabelComponent } from '../cds-label/cds-label.component';
import { AttachmentService } from '../../../core/api/attachment.service';

/**
 * Attach-a-file control for the config-driven master forms (`type: 'file'`).
 *
 * The control's *value is the stored string* — the URL or path that goes in the
 * record's column — not the file. That keeps it a drop-in replacement for the
 * text input it replaces: no config's toCreate/toUpdate mapping has to change.
 *
 * A picked file is handed to the parent through `fileSelected`; the parent is
 * responsible for uploading it and writing the resulting path back. That happens
 * in edit-model's uploadPendingFiles() on save, against
 * POST /api/Attachment/upload — the file is only sent once the form is saved, so
 * abandoning the dialog uploads nothing.
 */
@Component({
  selector: 'cds-file-attach',
  imports: [CommonModule, ReactiveFormsModule, CdsLabelComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdsFileAttachComponent),
      multi: true,
    },
  ],
  templateUrl: './cds-file-attach.component.html',
  styleUrl: './cds-file-attach.component.css',
})
export class CdsFileAttachComponent extends ControlValueAccessorDirective<string> {
  @Input() label = '';
  @Input() isAstRequired = false;
  @Input() isDisabled = false;
  /** Mirrors the `accept` attribute; also enforced against the file's MIME type. */
  @Input() accept = 'image/png,image/jpeg';
  @Input() maxFileSizeMb = 2;
  /** Shown under the button when the parent cannot persist a file yet. */
  @Input() unavailableNote = '';

  @Output() fileSelected = new EventEmitter<File | null>();

  /** Only for resolveUrl — this control never uploads; the parent does. */
  private readonly attachments = inject(AttachmentService);

  /* Signals, not plain fields — the app is zoneless, so the FileReader callback
     below only reaches the template through a signal. */
  readonly previewUrl = signal<string | null>(null);
  readonly fileName = signal<string | null>(null);
  readonly errorMsg = signal<string | null>(null);
  readonly showImageModal = signal(false);

  override writeValue(value: any): void {
    const stored = (value ?? '') as string;
    super.writeValue(stored);
    // Only a stored value produces a preview; a pending file sets its own.
    //
    // The control's value stays the stored path — that is what gets saved — but
    // the preview needs an absolute URL. The path is relative to the API, which
    // is a different origin from the app, so using it raw resolved against the
    // app and rendered a broken image on every record that had a photo.
    if (!this.fileName()) {
      this.previewUrl.set(this.attachments.resolveUrl(stored));
    }
  }

  get acceptedTypes(): string[] {
    return this.accept
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);
  }

  /** "Max 2MB • PNG, JPG" — derived so it cannot drift from what is enforced. */
  get constraintLabel(): string {
    const extensions = this.acceptedTypes
      .map((type) => type.split('/')[1]?.toUpperCase())
      .filter(Boolean)
      .join(', ');
    return `Max ${this.maxFileSizeMb}MB • ${extensions}`;
  }

  async onChangeFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.errorMsg.set(null);

    if (file.size > this.maxFileSizeMb * 1024 * 1024) {
      this.reject(input, `File size exceeds the ${this.maxFileSizeMb}MB limit.`);
      return;
    }

    if (!this.acceptedTypes.includes(file.type)) {
      const allowed = this.acceptedTypes
        .map((type) => type.split('/')[1]?.toUpperCase())
        .join(', ');
      this.reject(input, `Only ${allowed} files are allowed.`);
      return;
    }

    try {
      this.previewUrl.set(await this.toDataUrl(file));
      this.fileName.set(file.name);
      this.fileSelected.emit(file);
    } catch {
      this.reject(input, 'Could not read that file. Please try again.');
    }
  }

  /** Drops the pending file and the stored value alike. */
  onRemove(): void {
    this.previewUrl.set(null);
    this.fileName.set(null);
    this.errorMsg.set(null);
    this.fileSelected.emit(null);
    this._changed?.('');
    this._onTouched?.();
  }

  openImageModal(): void {
    if (this.previewUrl()) {
      this.showImageModal.set(true);
    }
  }

  closeImageModal(): void {
    this.showImageModal.set(false);
  }

  /** A broken or unreachable stored URL should not leave a dead image frame. */
  onPreviewError(): void {
    this.previewUrl.set(null);
  }

  private reject(input: HTMLInputElement, message: string): void {
    this.errorMsg.set(message);
    input.value = '';
  }

  private toDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
