import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionService } from '../../service/sesion.service';

@Component({
  selector: 'app-validate',
  standalone: false,
  templateUrl: './validate.component.html',
  styleUrl: './validate.component.scss'
})
export class ValidateComponent implements OnInit, OnDestroy {
  public token?: string;

  messages: string[] = [
    'Cargando...',
    'Validando credenciales',
    'Redirigiendo...'
  ];
  currentMessage = this.messages[0];
  visible = true;

  private index = 0;
  private intervalId: any;
  private swapDelay = 300; // ms fade out delay
  private period = 1000; // ms between swaps


  constructor(
    private route: ActivatedRoute,
    private sesionService: SesionService,
    private router: Router
  ) { }



  async ngOnInit(): Promise<void> {
    this.startCycle(this.period);
    this.token = this.route.snapshot.queryParamMap.get('code') ?? undefined;
    if (!await this.validateSession()) {
      console.log('Navegando a login externo');
      window.location.href = environment.appLogin + `?status=true&message=Error%20validando%20la%20sesión.%20Por%20favor,%20inicie%20sesión%20nuevamente.`;
    } else {
      console.log('Navegando a /erp/inicio');
      setTimeout(() => {
        this.router.navigateByUrl('/erp/inicio');
      }, 3000);
    }
  }

  async validateSession(): Promise<boolean> {
    if (this.token && this.token !== '') {
      try {
        const response = await this.sesionService.createSession(this.token);
        return response?.status === 200
      } catch (error) {
        console.error('Error validating session:', error);
      }
    }
    return false
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
