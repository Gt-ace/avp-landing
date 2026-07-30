import WorkProjectCard from './work-card-stack/WorkProjectCard'
import type { WorkCard } from './work-card-stack/work-card-model'

interface WorkCardStackProps {
  cards: WorkCard[]
}

export default function WorkCardStack({ cards }: WorkCardStackProps) {
  if (cards.length === 0) return null

  return (
    <section
      className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-16 md:gap-10 md:px-10 md:pb-24"
      aria-label="Selected work"
    >
      {cards.map((card, index) => (
        <WorkProjectCard key={card.id} card={card} eager={index === 0} />
      ))}
    </section>
  )
}
