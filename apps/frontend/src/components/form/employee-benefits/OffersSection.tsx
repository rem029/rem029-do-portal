import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EmployeeBenefit, EmployeeBenefitsCategory, Media } from '../../../types/payload-types';

// --- gsap plugins ---
gsap.registerPlugin(ScrollTrigger);

// --- icon components ---
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
  </svg>
);

interface OffersSectionProps {
  offers: EmployeeBenefit[];
  categories: EmployeeBenefitsCategory[];
  splashDone?: boolean;
}

export function OffersSection({ offers, categories, splashDone = true }: OffersSectionProps) {
  // --- state & refs ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number>(-1); // -1 is "All"
  const [displayOffers, setDisplayOffers] = useState(offers);
  const [activeModalOffer, setActiveModalOffer] = useState<EmployeeBenefit | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);

  // --- utility functions ---
  const getFilteredOffers = (search: string, categoryId: number) => {
    return offers.filter(offer => {
      const matchesSearch = offer.name.toLowerCase().includes(search.toLowerCase());
      
      const isAllCategory = categoryId === -1;
      const offerCategories = offer.general_info?.category || [];
      const matchesCategory = isAllCategory || offerCategories.some((cat: any) => 
        (typeof cat === 'object' ? cat.id === categoryId : cat === categoryId)
      );
      
      return matchesSearch && matchesCategory;
    });
  };

  // --- interaction handlers ---
  const handleFilterClick = (newCategoryId: number) => {
    if (newCategoryId === activeCategory) return;
    setActiveCategory(newCategoryId);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);

    const newOffers = getFilteredOffers(searchQuery, newCategoryId);
    setDisplayOffers(newOffers);
  };

  const { contextSafe } = useGSAP({ scope: sectionRef });

  const openModal = contextSafe((offer: EmployeeBenefit) => {
    setActiveModalOffer(offer);
    // @ts-ignore
    if (window.lenisInstance) window.lenisInstance.stop();
    else document.body.style.overflow = 'hidden';
  });

  const closeModal = contextSafe(() => {
    setActiveModalOffer(null);
    // @ts-ignore
    if (window.lenisInstance) window.lenisInstance.start();
    else document.body.style.overflow = '';
  });

  // --- effects & animations ---
  useGSAP(() => {
    if (isInitialMount.current) return;

    const cards = document.querySelectorAll('.offer-card-wrapper');
    if (cards.length > 0) {
      gsap.fromTo(cards,
        { opacity: 0, scale: 0.98, y: 15 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.out",
          overwrite: "auto"
        }
      );
    }
  }, { dependencies: [activeCategory], scope: sectionRef });

  useEffect(() => {
    // Only update on initial offers load to avoid double-transitions during category click
    const newOffers = getFilteredOffers(searchQuery, activeCategory);
    setDisplayOffers(newOffers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]); 

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (sectionRef.current) {
      const sectionTop = sectionRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: sectionTop, behavior: 'smooth' });
    }
  }, [activeCategory]);

  return (
    <section ref={sectionRef} className="relative w-full bg-white font-Noah-Regular text-primary tracking-normal min-h-screen">
      {/* horizontal nav bar */}
      <div className="flex justify-center w-full relative z-40 mb-12 px-4 h-[70px]">
        <div className="nav-bar-container flex flex-row items-center justify-between px-4 md:px-6 py-2.5 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-full w-full md:max-w-[1000px] mx-auto h-[56px] md:h-[64px]">
          
          <div className="search-container flex items-center shrink-0 px-2 flex-1 max-w-[320px]">
            <SearchIcon />
            <div className="search-input-wrapper overflow-hidden ml-2.5 flex items-center w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  setDisplayOffers(getFilteredOffers(val, activeCategory));
                }}
                className="bg-transparent border-none text-primary focus:outline-none focus:ring-0 w-full placeholder-slate-400 text-[15px] font-Noah-Regular"
              />
            </div>
          </div>

          <div className="divider w-px h-6 bg-slate-200 shrink-0 mx-4 md:mx-6"></div>

          <div className="categories-container hidden md:flex items-center justify-end gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleFilterClick(-1)}
              className={`whitespace-nowrap px-5 py-2 text-[15px] font-medium rounded-full transition-colors duration-300 will-change-transform ${activeCategory === -1
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:text-primary hover:bg-primary/10'
                }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleFilterClick(category.id)}
                className={`whitespace-nowrap px-5 py-2 text-[15px] font-medium rounded-full transition-colors duration-300 will-change-transform ${activeCategory === category.id
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:text-primary hover:bg-primary/10'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <button
            className="md:hidden flex items-center justify-center p-2 mx-1 rounded-full hover:bg-primary/10 text-primary transition-colors shrink-0"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col pb-32 relative z-10">
        {displayOffers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onClick={() => openModal(offer)}
          />
        ))}

        {displayOffers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <p className="text-slate-400 text-lg md:text-xl font-Noah-Regular mb-4">No offers found matching your criteria.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                handleFilterClick(-1);
              }}
              className="text-secondary hover:text-secondary font-medium transition-colors border-b border-transparent hover:border-secondary pb-0.5"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {activeModalOffer && (
        <OfferModal offer={activeModalOffer} onClose={closeModal} />
      )}

      {/* mobile filter menu */}
      {isMobileMenuOpen && (
        <>
          <style>{`
            @keyframes slideUpFast {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            @keyframes fadeInFast {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
          <div className="fixed inset-0 z-50 flex items-end md:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: 'fadeInFast 0.3s ease-out forwards' }} onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-full bg-white rounded-t-3xl p-6 pb-12 shadow-2xl border-t border-slate-100" style={{ animation: 'slideUpFast 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-Baskerville mb-4 text-primary">Filter Offers</h3>
              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar">
                <button
                  onClick={() => {
                    handleFilterClick(-1);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-base font-medium transition-colors ${
                    activeCategory === -1
                      ? 'bg-primary text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-primary/10'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      handleFilterClick(category.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3.5 rounded-2xl text-base font-medium transition-colors ${
                      activeCategory === category.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-primary/10'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// --- sub components ---

const OfferCard = ({ offer, onClick }: { offer: EmployeeBenefit, onClick: any }) => {
  const cardContainerRef = useRef(null);

  const offerMediaUrl = (offer.general_info?.media as Media)?.url;
  const categoriesList = offer.general_info?.category?.map((c: any) => c.name || '').join(', ') || 'Benefit';
  const subtitle = offer.benefits?.[0]?.title || '';

  return (
    <div
      ref={cardContainerRef}
      className="offer-card-wrapper w-full px-4 md:px-12 py-3 md:py-4 font-Noah-Regular text-primary tracking-normal"
    >
      <div
        className="offer-card relative w-full max-w-[1000px] mx-auto h-[120px] md:h-[180px] rounded-2xl md:rounded-[2rem] overflow-hidden cursor-pointer flex flex-row bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 will-change-transform group"
        data-offer-id={offer.id}
        onClick={(e) => {
          if (window.innerWidth < 768) {
            onClick();
          }
        }}
      >
        {/* left side: image */}
        <div className="card-image-container relative h-full w-[100px] md:w-[280px] shrink-0 overflow-hidden border-r border-slate-100">
          <div className="absolute inset-0 z-0 pointer-events-none group-hover:scale-105 transition-transform duration-500 ease-out">
            {offerMediaUrl && (
              <img
                src={offerMediaUrl}
                className="offer-image absolute inset-0 w-full h-full object-cover opacity-100"
                alt={offer.name}
              />
            )}
          </div>
        </div>

        {/* middle side: text content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center px-4 md:px-10 py-2 md:py-4 h-full relative z-30 pointer-events-none bg-white">
          <span className="text-slate-500 font-Noah-Regular text-[10px] md:text-xs tracking-widest uppercase mb-0.5 md:mb-2">
            {categoriesList}
          </span>
          <h3 className="offer-title text-primary text-base md:text-3xl font-Baskerville font-light tracking-wide truncate">
            {offer.name}
          </h3>
          {subtitle && (
            <p className="offer-subtitle text-slate-600 font-Noah-Regular text-xs md:text-sm mt-0.5 md:mt-2 line-clamp-1 md:line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* right side: arrow container (desktop only) */}
        <div className="hidden md:flex w-[140px] shrink-0 h-full items-center justify-center bg-slate-50/50 border-l border-slate-100 relative">
          <div
            className="offer-arrow w-8 h-8 md:w-14 md:h-14 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm z-40 cursor-pointer pointer-events-none group-hover:pointer-events-auto group-hover:bg-primary group-hover:border-primary group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-500 ease-out"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 text-primary group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

const OfferModal = ({ offer, onClose }: { offer: EmployeeBenefit, onClose: () => void }) => {
  const categoriesList = offer.general_info?.category?.map((c: any) => c.name || '').join(', ') || 'Benefit';
  const description = offer.benefits?.[0]?.description || '';
  
  const serializeTerms = (terms: any) => {
    if (!terms) return [];
    if (!Array.isArray(terms)) return [];
    return terms.map(node => {
      if (node.children) {
        return node.children.map((c: any) => c.text).join(' ');
      }
      return "";
    }).filter(t => t);
  }

  const termsStringList = serializeTerms(offer.terms_and_condition);

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPopIn {
          from { opacity: 0; transform: scale(0.96) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalStaggerItem {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 pointer-events-auto font-Noah-Regular tracking-normal">
        <div
          className="offer-modal-overlay absolute inset-0 bg-black/60 cursor-pointer"
          style={{ animation: 'modalFadeIn 0.2s ease-out forwards' }}
          onClick={onClose}
        />

        <div 
          className="offer-modal-content relative w-[95vw] max-w-6xl bg-primary rounded-none shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          style={{ animation: 'modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-full p-6 md:p-10 flex flex-col justify-start overflow-y-auto no-scrollbar">
          <span className="text-secondary font-Noah-Regular text-xs tracking-[0.2em] uppercase mb-2">
            {categoriesList}
          </span>

          <h2 className="text-white text-3xl md:text-5xl font-Baskerville font-light tracking-wide leading-tight mb-4">
            {offer.name}
          </h2>

          {description && (
            <p className="text-white/80 font-Noah-Regular text-sm leading-relaxed mb-6">
              {description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {offer.expiry_date && (
              <div className="flex flex-col">
                <span className="text-white/40 text-[10px] tracking-wider uppercase mb-1">Validity</span>
                <span className="text-white text-sm">{new Date(offer.expiry_date).toLocaleDateString()}</span>
              </div>
            )}
            {offer.contact_info?.address && (
              <div className="flex flex-col">
                <span className="text-white/40 text-[10px] tracking-wider uppercase mb-1">Location</span>
                <span className="text-white text-sm whitespace-pre-line">{offer.contact_info.address}</span>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-white/10 mb-6 shrink-0" />

          {termsStringList.length > 0 && (
            <div className="flex flex-col mb-6">
              <span className="text-white/40 text-[10px] tracking-wider uppercase mb-2">Terms & Conditions</span>
              <ul className="space-y-1.5">
                {termsStringList.map((term, i) => (
                  <li key={i} className="modal-term-item flex items-start text-white/70 text-[13px] leading-tight opacity-0" style={{ animation: `modalStaggerItem 0.2s ease-out ${0.1 + (i * 0.03)}s forwards` }}>
                    <span className="mr-2 text-secondary mt-0.5">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {offer.external_link && (
            <a href={offer.external_link} target="_blank" rel="noreferrer" className="mt-auto bg-secondary hover:brightness-90 text-primary py-3 px-8 rounded-none font-medium tracking-wide transition-colors self-start shadow-xl cursor-pointer">
              Redeem Offer
            </a>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
