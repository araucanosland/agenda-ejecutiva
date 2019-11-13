import { Component, OnInit, forwardRef, Input, EventEmitter, Output } from '@angular/core';
import { EmpresasService } from './../../services/empresas.service';
import { CookieService } from 'ngx-cookie-service';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-companias-asociadas',
  templateUrl: './companias-asociadas.component.html',
  styleUrls: ['./companias-asociadas.component.scss'],
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => CompaniasAsociadasComponent),
    }

  ]
})
export class CompaniasAsociadasComponent implements OnInit, ControlValueAccessor {
  
  companias: any;
  @Output() seleccion: EventEmitter<any> = new EventEmitter<any>();

  @Output() limpia: EventEmitter<any> = new EventEmitter<any>();
  
  @Input('value')
  myModelValue: string;

  @Input()
  leyenda: string = 'Selecciona la Empresa para filtrar.';

  @Input()
  desabilitado: boolean = false;

  constructor(
    private cookieService: CookieService,
    private empresasService: EmpresasService
  ) { }

  async ngOnInit() {
    let empresaListadoManager = await this.empresasService.listar(this.cookieService.get('Token'));
    empresaListadoManager.subscribe(xCompanyData => {
      this.companias = xCompanyData;
    });
  }

  onChange: any = (value) => {
    this.myModelValue = value;
    
  };
  onTouched: any = () => {};

  get value(){
    return this.myModelValue;
  }

  set value(value: string){
    this.myModelValue = value;
    this.onChange(value);
    this.onTouched();    
  }

  writeValue(value: any): void {
    this.value = value == null ? '': value;    
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  myChange(){
    this.value = this.myModelValue;
    this.seleccion.emit(this.myModelValue);
  }

  onClear() {
    this.limpia.emit();
  }


}
