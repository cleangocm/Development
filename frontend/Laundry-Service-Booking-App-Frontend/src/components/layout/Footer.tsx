'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaApple, FaGooglePlay, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { useTheme } from '@/context';
import api from '@/services/api';

interface QuickLink {
  name: string;
  url: string;
  icon?: string;
  logo?: string;
}

interface SiteSettings {
  siteName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  footerLogo: string;
  footerDescription: string;
  copyrightText: string;
  appDownloadLinks: QuickLink[];
  footerQuickLinks: QuickLink[];
  socialMediaLinks: QuickLink[];
}

const DEFAULTS: SiteSettings = {
  siteName: 'CleanGo',
  tagline: 'Collecte propre, avenir propre',
  email: 'support@cleangocm.com',
  phone: '+237 6XX XXX XXX',
  address: 'Yaounde, Cameroun',
  footerLogo: '',
  footerDescription: 'Votre partenaire pour la collecte intelligente des dechets menagers et professionnels. Des ramassages fiables, suivis et adaptes a votre quartier.',
  copyrightText: '© {year} CleanGo. Tous droits reserves.',
  appDownloadLinks: [],
  footerQuickLinks: [],
  socialMediaLinks: [],
};

const Footer = () => {
  const { t } = useTheme();
  const [site, setSite] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/public/site-settings');
        if (res.data.status === 'success' && res.data.data) {
          setSite((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch {
        // Use defaults silently
      }
    };
    fetchSettings();
  }, []);

  const defaultQuickLinks = [
    { label: t('home'), href: '/' },
    { label: t('aboutUs'), href: '/about' },
    { label: t('services'), href: '/services' },
    { label: t('contactUs'), href: '/contact' },
  ];

  // Use admin-defined quick links if available, otherwise defaults
  const quickLinks = site.footerQuickLinks.length > 0
    ? site.footerQuickLinks.map((l) => ({ label: l.name, href: l.url, icon: l.icon || '' }))
    : defaultQuickLinks.map((l) => ({ ...l, icon: '' }));

  // Use admin-defined social links if available, otherwise fallback to defaults
  const socialLinks = site.socialMediaLinks.length > 0
    ? site.socialMediaLinks
        .filter((s) => s.url)
        .map((s) => ({ url: s.url, icon: s.icon, label: s.name }))
    : [
        { url: '', icon: '', label: 'Facebook', reactIcon: FaFacebookF },
        { url: '', icon: '', label: 'Twitter', reactIcon: FaTwitter },
        { url: '', icon: '', label: 'Instagram', reactIcon: FaInstagram },
        { url: '', icon: '', label: 'LinkedIn', reactIcon: FaLinkedinIn },
      ];

  const copyrightDisplay = site.copyrightText.replace('{year}', new Date().getFullYear().toString());

  return (
    <footer className="bg-[#001529] text-white pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              {site.footerLogo ? (
                <div className="relative w-40 h-12">
                  <Image
                    src={site.footerLogo}
                    alt={site.siteName}
                    fill
                    sizes="(max-width: 768px) 10rem, 10rem"
                    className="object-contain object-left"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="relative w-36 h-10">
                  <Image
                    src="/Images/logo/footer.png"
                    alt={site.siteName}
                    fill
                    sizes="(max-width: 768px) 9rem, 9rem"
                    className="object-contain"
                    priority
                  />
                </div>
              )}
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed pr-0 md:pr-4">
              {site.footerDescription}
            </p>
            <div className="flex gap-3">
              {socialLinks.length > 0 && site.socialMediaLinks.length > 0 ? (
                // Admin-defined social links with custom icons
                socialLinks.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-9 h-9 bg-white/5 rounded-md flex items-center justify-center transition-all duration-300 hover:bg-[#00BFA6]"
                  >
                    {social.icon ? (
                      <SafeImage src={social.icon} alt={social.label} width={16} height={16} className="w-4 h-4 object-contain" unoptimized />
                    ) : (
                      <span className="text-xs font-medium">{social.label.charAt(0)}</span>
                    )}
                  </a>
                ))
              ) : (
                // Default fallback icons
                <>
                  <button type="button" aria-label="Facebook" className="w-9 h-9 bg-white/5 rounded-md flex items-center justify-center transition-all duration-300 hover:bg-[#00BFA6]"><FaFacebookF className="w-4 h-4" /></button>
                  <button type="button" aria-label="Twitter" className="w-9 h-9 bg-white/5 rounded-md flex items-center justify-center transition-all duration-300 hover:bg-[#00BFA6]"><FaTwitter className="w-4 h-4" /></button>
                  <button type="button" aria-label="Instagram" className="w-9 h-9 bg-white/5 rounded-md flex items-center justify-center transition-all duration-300 hover:bg-[#00BFA6]"><FaInstagram className="w-4 h-4" /></button>
                  <button type="button" aria-label="LinkedIn" className="w-9 h-9 bg-white/5 rounded-md flex items-center justify-center transition-all duration-300 hover:bg-[#00BFA6]"><FaLinkedinIn className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-base mb-5">{t('quickLink')}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => {
                const isExternal = link.href.startsWith('http');
                const linkContent = (
                  <span className="flex items-center gap-2">
                    {link.icon && (
                      <SafeImage src={link.icon} alt="" width={18} height={18} className="w-4.5 h-4.5 object-contain shrink-0" unoptimized />
                    )}
                    <span>{link.label}</span>
                  </span>
                );
                return (
                  <li key={link.label}>
                    {isExternal ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 text-sm hover:text-[#00BFA6] transition-colors duration-300"
                      >
                        {linkContent}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-400 text-sm hover:text-[#00BFA6] transition-colors duration-300"
                      >
                        {linkContent}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-base mb-5">{t('contactInfo')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <FaPhone className="text-[#ffffff] shrink-0 mt-0.5 w-3.5 h-3.5" />
                <span className="text-gray-400">{site.phone}</span>
              </li>
              <li className="flex items-start gap-2">
                <FaEnvelope className="text-[#ffffff] shrink-0 mt-0.5 w-3.5 h-3.5" />
                <span className="text-gray-400">{site.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-[#ffffff] shrink-0 mt-0.5 w-3.5 h-3.5" />
                <span className="text-gray-400">{site.address}</span>
              </li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h4 className="font-semibold text-base mb-5">{t('downloadApp')}</h4>
            <div className="space-y-3">
              {site.appDownloadLinks.length > 0 ? (
                site.appDownloadLinks.filter(link => link.url).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-white/5 rounded-lg px-4 py-2.5 transition-all duration-300 hover:bg-[#00BFA6] group"
                  >
                    {(link.logo || link.icon) ? (
                      <SafeImage src={link.logo || link.icon || ''} alt={link.name} width={20} height={20} className="w-5 h-5 object-contain" unoptimized />
                    ) : (
                      <FaGooglePlay className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    )}
                    <div>
                      <p className="text-[10px] text-gray-500 group-hover:text-white/70 uppercase transition-colors">{t('getItOn')}</p>
                      <p className="font-semibold text-white text-sm">{link.name}</p>
                    </div>
                  </a>
                ))
              ) : (
                <>
                  <div
                    className="flex items-center gap-2.5 bg-white/5 rounded-lg px-4 py-2.5 transition-all duration-300 hover:bg-[#00BFA6] group cursor-pointer"
                  >
                    <FaGooglePlay className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    <div>
                      <p className="text-[10px] text-gray-500 group-hover:text-white/70 uppercase transition-colors">{t('getItOn')}</p>
                      <p className="font-semibold text-white text-sm">{t('googlePlay')}</p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2.5 bg-white/5 rounded-lg px-4 py-2.5 transition-all duration-300 hover:bg-[#00BFA6] group cursor-pointer"
                  >
                    <FaApple className="w-5 h-5 text-white group-hover:text-white transition-colors" />
                    <div>
                      <p className="text-[10px] text-gray-500 group-hover:text-white/70 uppercase transition-colors">{t('downloadOn')}</p>
                      <p className="font-semibold text-white text-sm">{t('appStore')}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-6 text-center">
          <p className="text-gray-500 text-xs">
            {copyrightDisplay}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
