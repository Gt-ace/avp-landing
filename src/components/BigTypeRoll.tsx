import { TextRoll } from './ui/skiper-ui/skiper58'

type BigTypeRollProps = {
  text: string
  center?: boolean
}

export default function BigTypeRoll({
  text,
  center = false,
}: BigTypeRollProps) {
  return (
    <TextRoll className="bigtype-roll" center={center}>{text}</TextRoll>
  )
}
