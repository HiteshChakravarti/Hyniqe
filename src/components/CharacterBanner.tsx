import { ImageWithFallback } from './figma/ImageWithFallback';
import bannerImage from 'figma:asset/140fc8e2752ce21c23656c43e7c9f75073a2789b.png';

export function CharacterBanner() {
  return (
    <section className="py-20 px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl overflow-hidden shadow-2xl">
          <ImageWithFallback
            src={bannerImage}
            alt="HYNIQE AI Helpers at work"
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
