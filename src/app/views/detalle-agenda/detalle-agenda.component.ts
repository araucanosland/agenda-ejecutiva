import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment'; 
import { CookieService } from 'ngx-cookie-service';
import { EmpresasService } from './../../services/empresas.service';
import Agenda from './../../models/agenda.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import { Gestion } from './../../models/gestion.interface';

@Component({
  selector: 'app-detalle-agenda',
  templateUrl: './detalle-agenda.component.html',
  styleUrls: ['./detalle-agenda.component.scss']
})
export class DetalleAgendaComponent implements OnInit {

  eventForm: FormGroup;
  managementForm: FormGroup;
  ruta = ['Agenda'];
  fechasVisita: Date[];
  esNuevo: boolean = true;
  estaEditando: boolean = false;
  closeResult: string;
  idCita?: number = null;
  type: string;
  modeloPrueba: string = '';
  regsss = [];
  estamentos = [];
  cargos = [];
  agendaInfo;
  isSaving: boolean = false;
  

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private cookieService: CookieService,
    private empresaService: EmpresasService,
    private modalService: NgbModal
  ) { 

    this.eventForm = this.formBuilder.group({
      startDate: ['', Validators.required],
      company: ['', Validators.required],
      comments: '',
      periodicity: ['', Validators.required],
    });

    this.managementForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      estamento: ['', Validators.required],
      cargo: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', Validators.required],
      evalCredito: ['', Validators.required],
      evalSil: ['', Validators.required],
      evalServicio: ['', Validators.required],
      evalPcom: ['', Validators.required],
      evalAsfam: ['', Validators.required],
      evalGlobal: ['', Validators.required],
      comentarios: ['', Validators.required],
      alerta: ['', Validators.required],
      detalleAlerta: ''
    })

    let wildcard = this.route.snapshot.paramMap.get('wildcard');
    this.type = this.route.snapshot.paramMap.get('type');
    if(this.type === 'editar-cita'){
      this.agendaInfo = Number.parseInt(wildcard);
    }

    
  }

  async ngOnInit() {

    if(!this.cookieService.check('Rut')){
      alert('No hay usuario desde MDN, Se debe Salir')
    }

    let wildcard = this.route.snapshot.paramMap.get('wildcard');
    let company = this.route.snapshot.paramMap.get('company');

    if(this.type === 'nueva-cita'){
      this.esNuevo = true;
      this.ruta.push('Nueva Cita');


      let momento = moment(wildcard);
      let f = momento.toArray();
      
      this.eventForm.setValue({
        startDate: { year: f[0], month: (f[1]+1), day: f[2], _d: momento.toDate() },
        company: company,
        comments: '',
        periodicity: ''
      });



    }else if(this.type === 'editar-cita'){
      this.esNuevo = false;
      this.estaEditando = true;
      this.ruta.push('Modificar Cita');
      this.agendaInfo = Number.parseInt(wildcard);
      let vals = await this.empresaService.obtenerDetalleAgenda(Number.parseInt(wildcard))
      vals.subscribe(
        async (detAgenda: any) => {
          let momento = moment(detAgenda.fechaPrimeraVisita);
          let f = momento.toArray()
          this.eventForm.setValue({
            startDate: { year: f[0], month: (f[1]+1), day: f[2], _d: momento.toDate() },
            company: detAgenda.idAnexoEmpresa,
            comments: detAgenda.comentarios,
            periodicity: detAgenda.periocidad
          });

          (await this.empresaService.obtenerContactosCompania(detAgenda.idAnexoEmpresa)).subscribe(
            (response: any) => {
              this.regsss = response; 
            },
            (error: any) => {
              console.error('DetalleAgendaComponent.ngOnInit', {error})
            }
          )

          this.eventForm.disable();

        },
        error => {
          console.log({ error });
        }
      )
      
    }


    
    (await this.empresaService.listarEstamentos()).subscribe(
      (estamentos: any)=>{
        this.estamentos = estamentos;
      },
      (error: any) => {console.log({error})}
    );
  }

  async onSubmit(formData: any) {

    const userInfo = {
      rutEjecutivo: this.cookieService.get('Rut'), 
      codigoSucursal: Number.parseInt(this.cookieService.get('Oficina')),  
      token: this.cookieService.get('Token')
    };
    const frmd = { 
      anexoEmpresa: formData.company, 
      comentarios: formData.comments, 
      periocidad: formData.periodicity, 
      fechaPrimeraCita: formData.startDate._d, 
      citas: this.fechasVisita
    };

    let res = await this.empresaService.registrarCita(userInfo, frmd);

  
    res.subscribe(
      (agen: Agenda) => {
        console.log({ agen })
        alert('Datos Guardados con Exito');
        this.goToHome();
      },
      (error: any)=>{
        console.log({ error })
      }
    );
  }

  goToHome(){
    this.router.navigateByUrl('');
  }

  recibeFechas(lasFechas: any){
    this.fechasVisita = lasFechas.map((f:any)=>f.date);
  }

  open(content, itemValue: any) {
    if(this.type === 'editar-cita'){
      console.log({ itemValue });
      this.idCita = itemValue.id;
      this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'lg' }).result.then((result) => {
        this.closeResult = `Closed with: ${result}`;
      }, (reason) => {
        this.closeResult = `Dismissed ${reason}`;
      });
    }
  }

  /*WORKING HERE*/
  async onSubmitGestion(){
    this.isSaving = true;
    const userInfo = {
      rutEjecutivo: this.cookieService.get('Rut'), 
      codigoSucursal: Number.parseInt(this.cookieService.get('Oficina')),  
      token: this.cookieService.get('Token')
    };

    
    let envioDTO: Gestion = {
      ...this.managementForm.value,
      estamento: this.managementForm.value.estamento.id,
      nombre: this.managementForm.value.nombre.nombre !== undefined ? this.managementForm.value.nombre.nombre : this.managementForm.value.nombre,
      contactoId: this.managementForm.value.nombre.id,
      visitaId: this.idCita,
    };

    console.log({
      envioDTO
    });

      
    (await this.empresaService.registrarGestion(userInfo, envioDTO)).subscribe(
      (response: any) => {
        console.log('guardado correctamente', {response})
        this.managementForm.reset();
        alert('Gestion registrada exitosamente.');
        this.modalService.dismissAll('save click');
      }
    )
  }

  onClickAlertCheck(event: any){
    const isChecked = this.managementForm.value.alerta == 1;
    const detalleAlertaControl = this.managementForm.get('detalleAlerta');

    if(isChecked){
      detalleAlertaControl.setValidators(Validators.required);
    }else{
      detalleAlertaControl.clearValidators();
    }

    detalleAlertaControl.updateValueAndValidity();
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.regsss.filter(v => v.nombre.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10))
    )
    
  formatter(reg:any){
    return reg.nombre;
  } 

  selectContacto = async (event) => {
    const item = event.item;

    this.managementForm.patchValue({
      nombre: item.nombre,
      estamento: item.estamento.id,
      cargo: item.cargo.id,
      telefono: item.fono,
      email: item.mail,
    });

    (await this.empresaService.listarCargos(item.estamento.nodo)).subscribe(
      (ok: any)=>{
        this.cargos = ok;
      },
      (error: any) => {
        this.cargos = [];
      }
    )

  }

  async onChangeEstamento(event){

    const valorSeleccionado = this.managementForm.value.estamento;
    console.log({event, valorSeleccionado});
    (await this.empresaService.listarCargos(valorSeleccionado.nodo)).subscribe(
      (ok: any)=>{
        this.cargos = ok;
      },
      (error: any) => {
        this.cargos = [];
      }
    )
    
  }

  

}
