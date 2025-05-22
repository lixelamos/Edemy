import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FacebookLogo, 
  TwitterLogo, 
  LinkedinLogo, 
  GithubLogo, 
  GitBranch, 
  WhatsappLogo 
} from 'phosphor-react'

const SocialIcons = () => {
  return (
    <div className='flex items-center gap-3 mt-5 ml-1 mb-2 max-md:mt-4'>
      <Link 
        target='_blank' 
        to='https://www.facebook.com/share/1CU5mXmkLh/?mibextid=wwXIfr'
        className="group transition transform hover:scale-110 text-[#0b16f1] hover:text-blue-500"
      >
        <FacebookLogo size={34} weight="fill" className="transition-colors duration-300" />
      </Link>
      <Link 
        target='_blank' 
        to='https://x.com/lixel_amos'
        className="group transition transform hover:scale-110 text-[#cbc3c3] hover:text-gray-700"
      >
        <TwitterLogo size={34} weight="fill" className="transition-colors duration-300" />
      </Link>
      <Link 
        target='_blank' 
        to='https://www.linkedin.com/in/amosbett99/'
        className="group transition transform hover:scale-110 text-[#1e17ea] hover:text-blue-600"
      >
        <LinkedinLogo size={34} weight="fill" className="transition-colors duration-300" />
      </Link>
      <Link 
        target='_blank' 
        to='https://github.com/lixelamos'
        className="group transition transform hover:scale-110 text-[#c2baba] hover:text-gray-500"
      >
        <GithubLogo size={34} weight="fill" className="transition-colors duration-300" />
      </Link>
      <Link 
        target='_blank' 
        to='https://github.com/lixelamos/iCode'
        className="group transition transform hover:scale-110 text-[#e01d1d] hover:text-red-600"
      >
        <GitBranch size={34} weight="fill" className="transition-colors duration-300" />
      </Link>
      <Link 
        target='_blank' 
        to='https://wa.me/254723865500?text=Hey%20%F0%9F%91%8B%2C%20how%20can%20I%20help%20you%3F'
        className="group transition transform hover:scale-110 text-[#0fc865] hover:text-green-500"
      >
        <WhatsappLogo size={34} weight="fill" className="transition-colors duration-300" />
      </Link>
    </div>
  )
}

export default SocialIcons
