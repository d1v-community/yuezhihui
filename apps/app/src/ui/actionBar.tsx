import { View } from '@tarojs/components'
import type { PropsWithChildren } from 'react'
import './actionBar.less'

type Props = PropsWithChildren<{
  withSpacer?: boolean
}>

export function FCActionBar({ withSpacer = true, children }: Props) {
  return (
    <>
      {withSpacer ? <View className="fcActionSpacer" /> : null}
      <View className="fcActionBar">
        <View className="fcActionFrame">{children}</View>
      </View>
    </>
  )
}

