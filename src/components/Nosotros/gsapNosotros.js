import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

/* Un solo sitio donde se registran los plugins de Sobre nosotros. */
gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, SplitText)

/* Las animaciones de scroll solo existen sin movimiento reducido; con él, todo
   se ve en su estado final, quieto. Cada capítulo mete lo suyo aquí dentro. */
export const CON_MOVIMIENTO = '(prefers-reduced-motion: no-preference)'
export const CON_RATON = '(hover: hover) and (pointer: fine)'

export { gsap, ScrollTrigger, SplitText, useGSAP }
