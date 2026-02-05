import { Component, OnDestroy, OnInit } from '@angular/core';
import { SesionService } from '../../service/sesion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: false,

  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss'
})
export class InicioComponent implements OnInit, OnDestroy {
  messages: string[] = [
    'Cargando Configuración de inicio',
    'cargando datos de cliente',
    'Iniciando...'
  ];
  currentMessage = this.messages[0];
  visible = true;

  private index = 0;
  private intervalId: any;
  private swapDelay = 300; // ms fade out delay
  private period = 1000; // ms between swaps

  constructor(
    private sesionService: SesionService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.startCycle(this.period);
    const success = await this.sesionService.getPortalData();
    if (success) {
      setTimeout(() => {
        this.router.navigate(['/contenedor/pages']);
      }, 3000);
    } else {
      this.setMessage('Error cargando datos de inicio. Redirigiendo a login externo...', false);
      setTimeout(() => {
        window.location.href = 'http://localhost:8000/pages/login';
      }, 3000);
    }

  }

  ngOnDestroy(): void {
    this.stopCycle();
  }

  startCycle(periodMs: number = 3000): void {
    this.period = periodMs;
    this.stopCycle();
    this.visible = true;
    this.index = 0;
    this.currentMessage = this.messages[this.index];
    this.intervalId = setInterval(() => {
      this.visible = false;
      setTimeout(() => {
        this.index = (this.index + 1) % this.messages.length;
        this.currentMessage = this.messages[this.index];
        this.visible = true;
      }, this.swapDelay);
    }, this.period);
  }

  stopCycle(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Método público para actualizar mensaje inmediato y opcionalmente reiniciar ciclo
  setMessage(msg: string, restartCycle = false): void {
    this.stopCycle();
    this.currentMessage = msg;
    this.visible = true;
    if (restartCycle) this.startCycle(this.period);
  }

  // Añadir mensajes al ciclo
  pushMessage(msg: string): void {
    this.messages.push(msg);
  }

}
