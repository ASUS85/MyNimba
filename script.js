// --- FONCTION UTILITAIRE GÉNÉRIQUE POUR CARROUSEL AVEC DÉFILEMENT ET POINTS ---
/**
 * Initialise un carrousel à défilement horizontal avec gestion des points/états actifs.
 * @param {string} containerId L'ID du conteneur défilant (ex: 'services-scroll').
 * @param {string} dotsContainerId L'ID du conteneur des points (ex: 'carousel-dots').
 * @param {string} cardSelector Le sélecteur CSS des éléments à faire défiler (ex: '.service-card-h').
 */
function initScrollCarousel(containerId, dotsContainerId, cardSelector) {
    const container = document.getElementById(containerId);
    const dotsContainer = document.getElementById(dotsContainerId);
    // Sélectionne les cartes dans le conteneur
    const cards = container ? container.querySelectorAll(cardSelector) : [];

    if (!container || cards.length === 0) {
        console.warn(`Carousel initialization skipped for #${containerId}: Element ou cartes non trouvées.`);
        return;
    }

    // Détermine si des points sont nécessaires et présents
    const hasDots = dotsContainer && cards.length > 1;

    let isScrolling;

    // Détermine l'écart (gap) en fonction du sélecteur 
    let gap = 20; // Par défaut pour Testimonials/Partners 
    if (cardSelector === '.service-card-h') {
        gap = 32; // Gap spécifique aux Services
    }
    
    // Identifie si ce carrousel doit utiliser la logique de centrage
    const isCenterAligned = containerId === 'testimonials-scroll';
    
    // Récupère le padding gauche du conteneur (pour l'alignement au début)
    const containerPaddingLeft = parseFloat(window.getComputedStyle(container).paddingLeft || 0);


    // 1. Mise à jour de l'état actif des cartes et des points
    const updateActiveState = () => {
        const scrollLeft = container.scrollLeft;
        let activeIndex = 0; // Défaut à la première carte

        if (isCenterAligned) {
            // --- LOGIQUE POUR CARROUSEL CENTRÉ (AVIS CLIENTS) ---
            
            // Calcul du centre du viewport visible dans le conteneur
            const viewportCenter = scrollLeft + container.offsetWidth / 2;
            let closestDistance = Infinity;

            cards.forEach((card, index) => {
                // Calcule le centre absolu de la carte (position de départ + moitié de la largeur)
                const cardCenter = card.offsetLeft + card.offsetWidth / 2;
                
                // Distance entre le centre de la carte et le centre du viewport
                const distance = Math.abs(cardCenter - viewportCenter);
                
                // La carte active est celle dont le centre est le plus proche du centre du viewport
                if (distance < closestDistance) {
                    closestDistance = distance;
                    activeIndex = index;
                }
            });

        } else {
            // --- LOGIQUE STANDARD POUR CARROUSEL ALIGNÉ AU DÉBUT (Services, Partenaires) ---
            const firstCard = cards[0];
            if (!firstCard) return;

            // Calcul de la largeur effective du pas de défilement (largeur carte + gap)
            // On utilise la position offset de la carte suivante pour un calcul plus précis si possible
            const cardWidth = (cards.length > 1) ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth + gap;

            // Le défilement effectif commence après le paddingLeft
            // L'index actif est calculé en arrondissant le défilement actuel divisé par la largeur du pas.
            // On soustrait le padding gauche pour l'alignement
            const adjustedScrollLeft = scrollLeft + containerPaddingLeft;
            activeIndex = Math.round(adjustedScrollLeft / cardWidth);
            
            activeIndex = Math.max(0, Math.min(activeIndex, cards.length - 1));
        }

        // Met à jour l'état actif des cartes  pour l'effet d'échelle
        cards.forEach((card, index) => {
            // Applique la classe active uniquement à la carte calculée comme centrale
            card.classList.toggle('active', index === activeIndex);
        });

        // Met à jour l'état actif des points
        if (hasDots) {
            const dots = dotsContainer.querySelectorAll('.dot, .carousel-dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === activeIndex);
            });
        }
    };

    // 2. Défilement vers une carte spécifique (pour le clic sur les points)
    const scrollToCard = (index) => {
        const targetCard = cards[index];
        if (!targetCard) return;

        let targetScroll;

        if (isCenterAligned) {
            // Calcule la position de défilement pour CENTRER la carte
            targetScroll = targetCard.offsetLeft - (container.offsetWidth - targetCard.offsetWidth) / 2;
        } else {
            // Calcule la position de défilement pour aligner la carte au DÉBUT du conteneur
            
            targetScroll = targetCard.offsetLeft - containerPaddingLeft; 
        }

        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });

        // L'état actif sera mis à jour par l'événement 'scroll' avec debounce
    };

    // --- Initialisation des Éléments ---

    // A. Génère les points indicateurs
    if (hasDots) {
        dotsContainer.innerHTML = ''; // Nettoyer les points existants
        const dotClass = cardSelector === '.service-card-h' ? 'carousel-dot' : 'dot';

        cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add(dotClass);
            dot.setAttribute('data-index', index);
            dot.addEventListener('click', () => scrollToCard(index));
            dotsContainer.appendChild(dot);
        });
    }

    
    container.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        // Utiliser un debounce plus court pour une meilleure réactivité
        isScrolling = setTimeout(() => {
            updateActiveState();
        }, 50); 
    });

    // C. État initial et mise à jour au redimensionnement
    updateActiveState();
    window.addEventListener('resize', updateActiveState);

    // D. Exporte la fonction de défilement pour les contrôles externes (flèches)
    window[`scroll${containerId}`] = (direction) => {
        if (!container || cards.length === 0) return;

        // Déterminer la position cible de défilement basée sur l'index actif actuel
        const scrollLeft = container.scrollLeft;
        let targetIndex = 0;
        let cardWidth = cards[0].offsetWidth + gap; // Largeur par défaut

        // Trouver l'index actif actuel 
        // Utilisation de la position actuelle pour trouver la carte la plus proche
        if (isCenterAligned) {
            const viewportCenter = scrollLeft + container.offsetWidth / 2;
            let closestDistance = Infinity;

            cards.forEach((card, index) => {
                const distance = Math.abs((card.offsetLeft + card.offsetWidth / 2) - viewportCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    targetIndex = index;
                }
            });
        } else {
            // Logique alignée au début (Services, Partenaires)
            if (cards.length > 1) {
                // Utilise la position de la carte suivante pour calculer le pas
                cardWidth = cards[1].offsetLeft - cards[0].offsetLeft;
            }
            const adjustedScrollLeft = scrollLeft + containerPaddingLeft;
            targetIndex = Math.round(adjustedScrollLeft / cardWidth);
        }

        // Calculer le nouvel index (prochaine carte)
        targetIndex += direction;
        targetIndex = Math.max(0, Math.min(targetIndex, cards.length - 1));

        // Défilement vers la nouvelle carte ciblée
        scrollToCard(targetIndex);
        
        
    };
}

// --- LOGIQUE PRINCIPALE  ---
$(document).ready(function() {

    const mobileMenu = $('#mobileMenuContainer');
    const navToggler = $('.navbar-toggler');

    /* ================================
      GESTION DU MENU BADG
      ================================ */
    navToggler.on('click', function() {
        mobileMenu.slideToggle(300); // Fait glisser le menu mobile
    });

    // Fermer le menu mobile après un clic sur un lien
    mobileMenu.find('.nav-link').on('click', function() {
        // Retarder la fermeture pour la fluidité de la transition
        setTimeout(function() {
            mobileMenu.slideUp(300);
        }, 100);
    });

    /* ================================
      GESTION DES LIENS DE NAVIGATION 
      ================================ */
    $(window).on('scroll', function() {
        const scrollPos = $(document).scrollTop();
        $('.nav-link').each(function() {
            const href = $(this).attr('href');
            if (href && href.startsWith('#')) {
                const section = $(href);
                if (section.length) {
                    // Vérifie si la position de défilement est dans la section
                    if (section.offset().top - 100 <= scrollPos &&
                        section.offset().top + section.outerHeight() > scrollPos) {

                        // Enlever 'active' de tous les liens (Desktop et Mobile)
                        $('.nav-link').removeClass('active');

                        // Ajouter 'active' au lien dans la nav Desktop
                        $('#mainNav a[href="' + href + '"]').addClass('active');

                        // Ajouter 'active' au lien dans le menu Mobile
                        $('#mobileMenuContainer a[href="' + href + '"]').addClass('active');
                    }
                }
            }
        });
    });

    // Mettre à jour l'état de la navigation au chargement
    $(window).trigger('scroll');

    // Gérer le redimensionnement pour s'assurer que le menu mobile est caché sur Desktop
    $(window).resize(function() {
        if ($(window).width() > 767) {
            mobileMenu.hide();
        }
    }).trigger('resize');


    /* ================================
      FORMULAIRE DE CONTACT
      ================================ */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            console.log("Merci ! Votre message a été envoyé avec succès.");
            // Logique pour afficher une notification ici.
            this.reset();
        });
    }

    /* ================================
      BOUTON DEVIS
      ================================ */
    const quoteBtn = document.getElementById('quoteBtn');
    if (quoteBtn) {
        quoteBtn.addEventListener('click', function() {
            
            console.log("Fonction de demande de devis déclenchée !");
            // Logique pour ouvrir une modal de devis  ici.
        });
    }

    /* ================================
      ANIMATIONS AU SCROLL 
      ================================ */
    const ioOptions = { root: null, rootMargin: "0px", threshold: 0.25 };
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const section = entry.target;

            // Animation générale (fade + slide in)
            section.classList.add('visible');

            // On n'observe plus une fois animé
            obs.unobserve(section);
        });
    }, ioOptions);

    // Observe la section dynamique 
    document.querySelectorAll('.team-dynamic-section, #team-section').forEach(section => {
        observer.observe(section);
    });

    /* ================================
      INITIALISATION DES CARROUSELS
      ================================ */
    

    // Initialisation des Services
    initScrollCarousel('services-scroll', 'carousel-dots', '.service-card-h');

    // Initialisation des Avis Clients (Témoignages)
    initScrollCarousel('testimonials-scroll', 'testimonials-dots', '.testimonial-card');

    // Initialisation des Partenaires (sans points, l'ID des points sera ignoré si absent)
    initScrollCarousel('partners-scroll', 'partners-dots', '.partner-logo');
});
