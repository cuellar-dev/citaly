import { Wifi, ParkingCircle, Snowflake, Cigarette, CreditCard, CigaretteOff } from 'lucide-react'
import './icons.css'

const Icons = ({ id }) => {
  let icon, text;

  switch(id){
    case 'wifi': 
    icon = <Wifi className='icon' size={23} color='currentColor'/>;
    text = 'Wifi';
    break;
    case 'parking' : 
    icon = <ParkingCircle className='icon' size={23} color='currentColor'/>
    text = 'Parqueo';
    break;
    case 'snow' : 
    icon = <Snowflake className='icon' size={23} color='currentColor'/>;
    text = 'Climatizado';
    break;
    case 'cigarrete' : 
    icon = <Cigarette className='icon' size={23} color='currentColor'/>
    text = 'Fumar'
    break;
    case 'transfer' : 
    icon = <CreditCard className='icon' size={23} color='currentColor'/>;
    text = 'Transferencia';
    break;
    case 'no-cigarrete' : 
    icon = <CigaretteOff className='icon' size={23} color='currentColor'/>;
    text = '0 Humo';
    break;
  }
  return (
    <div className='icon-container'>
      {icon}
      <span className="icon-text">{text}</span>
    </div>
  )
}
export default Icons