import { ILifetime } from '../Lifetime'
import { extractSelector } from '../utils'
import { MockStrategy, ProviderMock, proxyLifetimes } from './mockUtils'
import { DependencyInformation, DependencyMap, LifetimeCollection, Selector } from './types'
import { ServiceProvider } from '../ServiceProvider'

export class ServiceCollection<E = {}> {
  private readonly lifetimes: Record<keyof E, ILifetime<unknown, E>>

  constructor(dependencies: DependencyMap<E, E>) {
    this.lifetimes = Object.entries<DependencyInformation<unknown, any>>(dependencies).map(([name, data]) => {
      const factory = 'factory' in data
        ? data.factory
        // @ts-ignore the factory can be either p => new or (p, props) => new, but ts don't know this
        : (p: any, props: any) => new data.constructor(p, props)
      const { lifetime: Lifetime } = data
      return new Lifetime(name, factory)
    }).reduce((a, b) => {
      a[b.name] = b
      return a
    }, {} as any)
  }

  get<T>(selector: Selector<T, E>): ILifetime<T, E> | undefined {
    return this.lifetimes[extractSelector(selector)] as ILifetime<T, E>
  }

  replace(dependencies: DependencyMap<E, E>): ServiceCollection<E> {
    Object.entries<DependencyInformation<unknown, any>>(dependencies).forEach(([name, data]) => {
      const factory = 'factory' in data
        ? data.factory
        // @ts-ignore the factory can be either p => new or (p, props) => new, but ts don't know this
        : (p: any, props: any) => new data.constructor(p, props)
      const { lifetime: Lifetime } = data
      this.lifetimes[name as keyof E] = new Lifetime(name, factory)
    })
    return this
  }

  build(): ServiceProvider<E> {
    const lifetimes = Object.values<ILifetime<unknown, E>>(this.lifetimes)
      .map(e => e.clone())
      .reduce((a, b) => {
        a[b.name] = b
        return a
      }, {} as LifetimeCollection)
    return new ServiceProvider<E>(lifetimes)
  }

  buildMock(mock: MockStrategy | ProviderMock<E> = {}, defaultMockType?: MockStrategy): ServiceProvider<E> {
    return proxyLifetimes(this, mock, defaultMockType)
  }
}

export const services = <E>(dependencies: DependencyMap<E, E>) => new ServiceCollection<E>(dependencies)