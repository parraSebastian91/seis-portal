import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  UploadModalConfig,
  UploadModalService
} from 'shared-utils';

@Component({
  selector: 'app-modal-upload-object',
  standalone: false,
  templateUrl: './modal-upload-object.component.html',
  styleUrl: './modal-upload-object.component.scss'
})
export class ModalUploadObjectComponent implements OnInit, OnDestroy {
  private readonly uploadModalService = inject(UploadModalService);

  isOpen = false;
  isDragging = false;
  selectedFile: File | null = null;

  config: UploadModalConfig = {
    accept: '.pdf,.xml,image/*',
    title: 'Subir archivo',
    hint: 'Acepta PDF, XML o imagen (JPG/PNG).'
  };

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.uploadModalService.open$.subscribe((config) => {
      this.config = { ...this.config, ...config };
      this.selectedFile = null;
      this.isDragging = false;
      this.isOpen = true;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get selectedFileName(): string {
    return this.selectedFile?.name || 'Ningún archivo seleccionado';
  }

  get isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  }

  close(): void {
    this.isOpen = false;
    this.uploadModalService.emitClose();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.selectedFile = file;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (file) this.selectedFile = file;
    if (input) input.value = '';
  }

  submit(): void {
    if (!this.selectedFile) return;
    this.uploadModalService.emitFile({
      file: this.selectedFile,
      context: this.config.context
    });
    this.isOpen = false;
  }
}
