import { defineStore } from "pinia";


export const useDG = defineStore('dg',{
    state: () => ({
        dg: {//data general
            country: 'Perú',
            uit: 5350,
            rmv: 1130,//remuneración mínima vital
            ams: 0.09,//aporte mínimo essalud
            af: 0.1,//asignación familiar
            sp: [//sistema de pensiones
                    {   
                        id: 1,
                        name: 'onp',
                        csf:  0,//comisión sobre flujo (% Remuneración Bruta Mensual)
                        ps:  0,//prima de seguros (%) (% Remuneración Bruta Mensual)
                        aofd:  0.13, //APORTE OBLIGATORIO AL FONDO DE PENSIONES (% Remuneración Bruta Mensual)
                        rma:  12137.47//REMUNERACIÓN MÁXIMA ASEGURABLE
                    },
                    {
                        id: 2,
                        name: 'habitad',
                        csf:  0.0147,//comisión sobre flujo (% Remuneración Bruta Mensual)
                        ps:  0.0137,//prima de seguros (%) (% Remuneración Bruta Mensual)
                        aofd:  0.1, //APORTE OBLIGATORIO AL FONDO DE PENSIONES (% Remuneración Bruta Mensual)
                        rma:  12137.47//REMUNERACIÓN MÁXIMA ASEGURABLE
                    },
                    {
                        id: 3,
                        name: 'integra',
                        csf:  0.0155,//comisión sobre flujo (% Remuneración Bruta Mensual)
                        ps:  0.0137,//prima de seguros (%) (% Remuneración Bruta Mensual)
                        aofd:  0.1, //APORTE OBLIGATORIO AL FONDO DE PENSIONES (% Remuneración Bruta Mensual)
                        rma:  12137.47//REMUNERACIÓN MÁXIMA ASEGURABLE
                    },
                    {
                        id: 4,
                        name: 'prima',
                        csf:  0.0160,//comisión sobre flujo (% Remuneración Bruta Mensual)
                        ps:  0.0137,//prima de seguros (%) (% Remuneración Bruta Mensual)
                        aofd:  0.1, //APORTE OBLIGATORIO AL FONDO DE PENSIONES (% Remuneración Bruta Mensual)
                        rma:  12137.47//REMUNERACIÓN MÁXIMA ASEGURABLE
                    },
                    {   
                        id: 5,
                        name: 'profuturo',
                        csf:  0.0169,//comisión sobre flujo (% Remuneración Bruta Mensual)
                        ps:  0.0137,//prima de seguros (%) (% Remuneración Bruta Mensual)
                        aofd:  0.1, //APORTE OBLIGATORIO AL FONDO DE PENSIONES (% Remuneración Bruta Mensual)
                        rma:  12137.47//REMUNERACIÓN MÁXIMA ASEGURABLE
                    },
                ]
            },
    }),
    actions:({
        a_f(){
            return this.dg.af * this.dg.rmv;
        },
        a_m_s(){
            return this.ams * this.rmv;
        }
    })
});