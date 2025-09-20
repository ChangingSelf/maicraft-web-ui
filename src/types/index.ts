// TypeScript 高级类型定义和泛型工具
// 提供常用类型工具，提升开发体验和类型安全

// ============================================================================
// 基础工具类型
// ============================================================================

/**
 * 从联合类型中提取特定类型
 * ExtractType<'a' | 'b' | 'c', 'a' | 'b'> => 'a' | 'b'
 */
export type ExtractType<T, U> = T extends U ? T : never

/**
 * 从联合类型中排除特定类型
 * ExcludeType<'a' | 'b' | 'c', 'a'> => 'b' | 'c'
 */
export type ExcludeType<T, U> = T extends U ? never : T

/**
 * 构造一个类型，其中所有属性都设置为可选的深度版本
 * DeepPartial<{ a: { b: string } }> => { a?: { b?: string } }
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 构造一个类型，其中所有属性都设置为必填的深度版本
 * DeepRequired<{ a?: { b?: string } }> => { a: { b: string } }
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * 构造一个类型，其中所有属性都设置为只读的深度版本
 * DeepReadonly<{ a: { b: string } }> => { readonly a: { readonly b: string } }
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * 构造一个类型，其中所有属性都设置为可写的深度版本
 * DeepWritable<{ readonly a: { readonly b: string } }> => { a: { b: string } }
 */
export type DeepWritable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepWritable<T[P]> : T[P]
}

/**
 * 从对象类型中提取值类型
 * ValueOf<{ a: string; b: number }> => string | number
 */
export type ValueOf<T> = T[keyof T]

/**
 * 从对象类型中提取键类型
 * KeyOf<{ a: string; b: number }> => 'a' | 'b'
 */
export type KeyOf<T> = keyof T

/**
 * 创建一个包含所有可能值的联合类型
 * UnionOf<{ a: string; b: number }> => string | number
 */
export type UnionOf<T> = T[keyof T]

// ============================================================================
// 字符串操作类型
// ============================================================================

/**
 * 首字母大写
 * CapitalizeFirst<'hello'> => 'Hello'
 */
export type CapitalizeFirst<S extends string> = S extends `${infer F}${infer R}`
  ? `${Capitalize<F>}${R}`
  : S

/**
 * 首字母小写
 * UncapitalizeFirst<'Hello'> => 'hello'
 */
export type UncapitalizeFirst<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uncapitalize<F>}${R}`
  : S

/**
 * 驼峰命名转换为短横线命名
 * CamelToKebab<'camelCase'> => 'camel-case'
 */
export type CamelToKebab<S extends string> = S extends `${infer F1}${infer F2}${infer R}`
  ? F2 extends Capitalize<F2>
    ? `${F1}-${Lowercase<F2>}${CamelToKebab<R>}`
    : `${F1}${F2}${CamelToKebab<R>}`
  : S

/**
 * 短横线命名转换为驼峰命名
 * KebabToCamel<'kebab-case'> => 'kebabCase'
 */
export type KebabToCamel<S extends string> = S extends `${infer F}-${infer R}`
  ? `${F}${Capitalize<KebabToCamel<R>>}`
  : S

/**
 * 移除字符串前后的空白字符
 * Trim<'  hello  '> => 'hello'
 */
export type Trim<S extends string> = S extends ` ${infer T}` | `${infer T} ` ? Trim<T> : S

// ============================================================================
// 函数相关类型
// ============================================================================

/**
 * 提取函数的参数类型
 * ParametersType<(a: string, b: number) => void> => [string, number]
 */
export type ParametersType<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P
  : never

/**
 * 提取函数的返回值类型
 * ReturnType<(a: string) => number> => number
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R
  ? R
  : never

/**
 * 创建一个函数类型，接受相同参数但返回Promise
 * AsyncFunction<(a: string) => number> => (a: string) => Promise<number>
 */
export type AsyncFunction<T extends (...args: any) => any> = (
  ...args: ParametersType<T>
) => Promise<ReturnType<T>>

/**
 * 创建一个函数类型，接受相同参数但返回void
 * VoidFunction<(a: string) => number> => (a: string) => void
 */
export type VoidFunction<T extends (...args: any) => any> = (...args: ParametersType<T>) => void

/**
 * 函数组合类型
 * ComposeFunctions<[(a: number) => string, (b: string) => boolean]> => (a: number) => boolean
 */
export type ComposeFunctions<T extends readonly [any, ...any[]]> = T extends readonly [
  infer F,
  ...infer R,
]
  ? R extends readonly []
    ? F
    : F extends (arg: infer A) => any
      ? ComposeFunctions<R> extends (arg: A) => infer B
        ? (arg: ParametersType<F>[0]) => B
        : never
      : never
  : never

// ============================================================================
// 数组和元组类型
// ============================================================================

/**
 * 获取数组的长度类型
 * LengthOf<[1, 2, 3]> => 3
 */
export type LengthOf<T extends readonly any[]> = T['length']

/**
 * 获取数组的第一个元素类型
 * FirstOf<[1, 2, 3]> => 1
 */
export type FirstOf<T extends readonly any[]> = T extends readonly [infer F, ...any[]] ? F : never

/**
 * 获取数组的最后一个元素类型
 * LastOf<[1, 2, 3]> => 3
 */
export type LastOf<T extends readonly any[]> = T extends readonly [...any[], infer L] ? L : never

/**
 * 移除数组的第一个元素
 * Shift<[1, 2, 3]> => [2, 3]
 */
export type Shift<T extends readonly any[]> = T extends readonly [any, ...infer R] ? R : []

/**
 * 在数组开头添加元素
 * Unshift<[2, 3], 1> => [1, 2, 3]
 */
export type Unshift<T extends readonly any[], U> = [U, ...T]

/**
 * 反转数组
 * Reverse<[1, 2, 3]> => [3, 2, 1]
 */
export type Reverse<T extends readonly any[]> = T extends readonly [infer F, ...infer R]
  ? [...Reverse<R>, F]
  : []

/**
 * 检查类型是否为数组
 * IsArray<string[]> => true
 * IsArray<string> => false
 */
export type IsArray<T> = T extends readonly any[] ? true : false

// ============================================================================
// 对象操作类型
// ============================================================================

/**
 * 从对象中选择指定的属性
 * PickByType<{ a: string; b: number; c: string }, string> => { a: string; c: string }
 */
export type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
}

/**
 * 从对象中排除指定的属性类型
 * OmitByType<{ a: string; b: number; c: string }, string> => { b: number }
 */
export type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K]
}

/**
 * 创建一个包含指定路径的嵌套对象
 * NestedPick<{ a: { b: { c: string; d: number } } }, ['a', 'b', 'c']> => { a: { b: { c: string } } }
 */
export type NestedPick<T, K extends readonly (keyof any)[]> = K extends readonly [
  infer F,
  ...infer R,
]
  ? F extends keyof T
    ? R extends readonly []
      ? Pick<T, F>
      : { [P in F]: NestedPick<T[P], R> }
    : never
  : T

/**
 * 展开对象的所有属性到一个扁平结构
 * Flatten<{ a: { b: string; c: number }; d: boolean }> => { 'a.b': string; 'a.c': number; d: boolean }
 */
export type Flatten<T> = T extends readonly (infer U)[]
  ? U extends object
    ? Flatten<U>[]
    : T
  : T extends object
    ? {
        [K in keyof T as K extends string | number | symbol
          ? T[K] extends object
            ? `${K}.${keyof T[K] & string}` | K
            : K
          : never]: K extends `${infer P}.${infer S}`
          ? P extends keyof T
            ? S extends keyof T[P]
              ? T[P][S]
              : never
            : never
          : K extends keyof T
            ? T[K]
            : never
      }
    : T

// ============================================================================
// Vue相关类型工具
// ============================================================================

/**
 * Vue组件实例类型
 */
export type VueComponentInstance = {
  $el: HTMLElement
  $data: Record<string, any>
  $props: Record<string, any>
  $emit: (event: string, ...args: any[]) => void
  $slots: Record<string, any>
  $scopedSlots: Record<string, any>
  $refs: Record<string, any>
  $parent: VueComponentInstance | null
  $children: VueComponentInstance[]
  $nextTick: (fn: () => void) => Promise<void>
  $destroy: () => void
  $mount: (element?: string | HTMLElement) => VueComponentInstance
}

/**
 * Vue组合式API的计算属性类型
 */
export type VueComputed<T> = {
  readonly value: T
} & (() => T)

/**
 * Vue响应式引用类型
 */
export type VueRef<T> = {
  value: T
}

/**
 * Vue响应式对象类型
 */
export type VueReactive<T extends object> = T

/**
 * 从Vue组件中提取props类型
 */
export type VueProps<T extends { props?: any }> = T['props']

/**
 * 从Vue组件中提取emit类型
 */
export type VueEmits<T extends { emits?: any }> = T['emits']

// ============================================================================
// API相关类型工具
// ============================================================================

/**
 * API响应的成功状态
 */
export type ApiSuccess<T> = {
  isSuccess: true
  data: T
  message?: string
  timestamp: number
  requestId?: string
}

/**
 * API响应的失败状态
 */
export type ApiError = {
  isSuccess: false
  message: string
  code?: string
  details?: any
  timestamp: number
  requestId?: string
}

/**
 * API响应的联合类型
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError

/**
 * 从API响应中提取数据类型
 */
export type ApiData<T extends ApiResponse<any>> = T extends ApiSuccess<infer D> ? D : never

/**
 * 创建API响应的类型守卫
 */
export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiSuccess<T> => {
  return response.isSuccess === true
}

export const isApiError = <T>(response: ApiResponse<T>): response is ApiError => {
  return response.isSuccess === false
}

/**
 * HTTP方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/**
 * HTTP状态码类型
 */
export type HttpStatusCode =
  | 200 // OK
  | 201 // Created
  | 202 // Accepted
  | 204 // No Content
  | 301 // Moved Permanently
  | 302 // Found
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 422 // Unprocessable Entity
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable

// ============================================================================
// 实用工具类型
// ============================================================================

/**
 * 延迟类型解析（用于处理循环引用）
 * Defer<T> => T（但在类型检查时延迟解析）
 */
export type Defer<T> = T extends any ? T : never

/**
 * 条件类型的高级版本
 * If<Condition, Then, Else>
 */
export type If<C extends boolean, T, F> = C extends true ? T : F

/**
 * 相等检查类型
 * Equal<A, B> => A extends B ? (B extends A ? true : false) : false
 */
export type Equal<A, B> = A extends B ? (B extends A ? true : false) : false

/**
 * 非空检查类型
 * NonNullable<T> => T & {}
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * 可选属性转换为必填属性
 * OptionalToRequired<{ a?: string; b: number }> => { a: string; b: number }
 */
export type OptionalToRequired<T> = {
  [K in keyof T]-?: T[K]
}

/**
 * 必填属性转换为可选属性
 * RequiredToOptional<{ a: string; b: number }> => { a?: string; b?: number }
 */
export type RequiredToOptional<T> = {
  [K in keyof T]+?: T[K]
}

/**
 * 合并两个对象类型，后面的覆盖前面的
 * Merge<A, B> => A & B，但B的属性会覆盖A的同名属性
 */
export type Merge<A, B> = Omit<A, keyof B> & B

/**
 * 创建一个包含所有函数属性的对象类型
 * FunctionKeys<T> => 所有值为函数的键
 */
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

/**
 * 创建一个排除所有函数属性的对象类型
 * NonFunctionKeys<T> => 所有值不为函数的键
 */
export type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K
}[keyof T]

// ============================================================================
// 高级模式匹配类型
// ============================================================================

/**
 * 模式匹配类型的基础
 * PatternMatch<T, Pattern> => 根据Pattern匹配T的结构
 */
export type PatternMatch<T, P> = T extends P ? true : false

/**
 * 联合类型到元组的转换
 * UnionToTuple<'a' | 'b' | 'c'> => ['a', 'b', 'c']
 */
export type UnionToTuple<T> = (
  (T extends any ? (t: T) => T : never) extends (t: infer R) => any ? R : never
) extends (_: any) => infer U
  ? [...UnionToTuple<Exclude<T, U>>, U]
  : []

/**
 * 获取联合类型的长度
 * UnionLength<'a' | 'b' | 'c'> => 3
 */
export type UnionLength<T> = UnionToTuple<T>['length']

/**
 * 检查联合类型是否为空
 * IsEmptyUnion<never> => true
 * IsEmptyUnion<'a'> => false
 */
export type IsEmptyUnion<T> = [T] extends [never] ? true : false

// ============================================================================
// 导出所有类型工具
// ============================================================================

// ============================================================================
// 业务类型导出
// ============================================================================

// 导出API相关类型
export * from './api'

// 导出游戏相关类型
export * from './game'

// 默认导出所有类型工具
export default {
  // 可以在运行时使用这些工具函数
  isApiSuccess,
  isApiError,
}
